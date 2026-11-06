import { http, HttpResponse, delay } from 'msw'
import { db } from './db'
import type { StoredOrder } from './db'
import { apiError, authenticate } from './auth'
import { buildCart } from './cart'
import { SETTLE_DELAY_MS, settleDueOrders } from './orders'
import { consumeOption, failureFor, getOption } from './scenarios'
import { validators } from '@/lib/validators'
import type { CreateOrderRequest, Order } from '@/types/api'

export const orderHandlers = [
  http.post('/api/orders', async ({ request }) => {
    await delay(400)
    const failure = failureFor('orders')
    if (failure) return failure
    const auth = authenticate(request)
    if ('error' in auth) return auth.error
    const userId = auth.user.id
    settleDueOrders(userId)

    const key = (request.headers.get('Idempotency-Key') ?? '').trim()
    if (!key || key.length > 100) {
      return apiError(400, 'VALIDATION_ERROR', 'Chave de idempotência ausente ou inválida.')
    }

    const body = (await request.json()) as Partial<CreateOrderRequest>
    const displayName = String(body.collector?.displayName ?? '').trim()
    const email = String(body.collector?.email ?? '').trim()
    const note = String(body.collector?.note ?? '').trim()
    // A conexão da carteira não entra no conteúdo: reconectar não pode gerar outro pedido.
    const requestHash = JSON.stringify([body.quoteId, body.walletId, displayName, email, note])

    // 1. Idempotência: mesma chave e mesmo conteúdo = mesmo pedido; conteúdo diferente = conflito
    const existing = db.orders.find((o) => o.userId === userId && o.idempotencyKey === key)
    if (existing) {
      if (existing.requestHash !== requestHash) {
        return apiError(409, 'CONFLICT', 'Esta chave de idempotência já foi usada com outro conteúdo.')
      }
      return HttpResponse.json(existing.order, { headers: { 'Idempotent-Replay': 'true' } })
    }

    // 2. Validação dos dados do colecionador
    const fieldErrors: Record<string, string> = {}
    const eName = validators.displayName(displayName)
    const eMail = validators.email(email)
    const eNote = validators.note(note)
    if (eName) fieldErrors.displayName = eName
    if (eMail) fieldErrors.email = eMail
    if (eNote) fieldErrors.note = eNote
    if (Object.keys(fieldErrors).length > 0) {
      return apiError(400, 'VALIDATION_ERROR', 'Confira os campos informados.', fieldErrors)
    }

    // 3. Carteira e conexão
    const wallet = db.wallets.find((w) => w.id === body.walletId && w.userId === userId)
    if (!wallet) return apiError(404, 'NOT_FOUND', 'Carteira não encontrada.')
    const connection = db.connections.find(
      (c) => c.id === body.connectionId && c.userId === userId && c.walletId === wallet.id && c.active,
    )
    if (!connection) {
      return apiError(409, 'CONFLICT', 'A carteira foi desconectada. Confirme de novo para reconectar.')
    }

    // 4. Revalidação: preço, disponibilidade, cupom e taxas
    const cart = buildCart(`user:${userId}`)
    if (cart.items.length === 0) return apiError(400, 'VALIDATION_ERROR', 'Seu carrinho está vazio.')
    if (cart.hasIssues || cart.quoteId !== body.quoteId) {
      const message = cart.hasIssues
        ? 'Alguns itens ficaram indisponíveis. Ajuste o carrinho para continuar.'
        : 'Os valores do seu pedido mudaram. Revise o resumo e confirme novamente.'
      return apiError(409, 'QUOTE_CHANGED', message, undefined, { cart })
    }

    // 5. Cria o pedido (snapshot do carrinho)
    const now = new Date()
    const order: Order = {
      id: `ord-${crypto.randomUUID().slice(0, 8)}`,
      status: 'pending',
      items: cart.items.map((l) => ({
        nftId: l.nftId,
        name: l.name,
        tokenId: l.tokenId,
        image: l.image,
        editionLabel: l.editionLabel,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        lineTotal: l.lineTotal,
      })),
      couponCode: cart.coupon?.code,
      subtotal: cart.subtotal,
      discount: cart.discount,
      networkFee: cart.networkFee,
      total: cart.total,
      network: wallet.network,
      walletProvider: connection.provider,
      walletNickname: wallet.nickname,
      walletAddress: wallet.address,
      collector: { displayName, email, note: note || undefined },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      version: 1,
    }
    const stored: StoredOrder = {
      userId,
      idempotencyKey: key,
      requestHash,
      settleAt: new Date(now.getTime() + SETTLE_DELAY_MS).toISOString(),
      outcome: getOption('payment', 'confirm') === 'refuse' ? 'refused' : 'confirmed',
      order,
    }
    db.update((s) => {
      s.orders.push(stored)
    })
    setTimeout(() => settleDueOrders(userId), SETTLE_DELAY_MS + 50)

    // Cenário "timeout": o pedido foi criado, mas a resposta se perde (uma vez só).
    if (consumeOption('payment', 'timeout')) return HttpResponse.error()
    return HttpResponse.json(order, { status: 201 })
  }),

  http.get('/api/orders', async ({ request }) => {
    await delay(200)
    const auth = authenticate(request)
    if ('error' in auth) return auth.error
    settleDueOrders(auth.user.id)
    const key = new URL(request.url).searchParams.get('idempotencyKey')
    const items = db.orders
      .filter((o) => o.userId === auth.user.id && (!key || o.idempotencyKey === key))
      .map((o) => o.order)
      .reverse()
    return HttpResponse.json({ items })
  }),

  // Pedido de outro usuário responde 404, como se não existisse.
  http.get('/api/orders/:id', async ({ request, params }) => {
    await delay(200)
    const auth = authenticate(request)
    if ('error' in auth) return auth.error
    settleDueOrders(auth.user.id)
    const entry = db.orders.find((o) => o.order.id === String(params.id) && o.userId === auth.user.id)
    if (!entry) return apiError(404, 'NOT_FOUND', 'Pedido não encontrado.')
    return HttpResponse.json(entry.order)
  }),
]