import { http, HttpResponse, delay } from 'msw'
import { db } from './db'
import { apiError, authenticate, bearerToken } from './auth'
import { COUPONS, buildCart, resolveOwner } from './cart'
import { failureFor } from './scenarios'
import type { AddCartItemRequest, MergeCartResponse } from '@/types/api'

const newItemId = () => `item-${crypto.randomUUID().slice(0, 8)}`

const stockMessage = (available: number, inCart: number) =>
  available === 0
    ? 'Esta edição está esgotada.'
    : `Só há ${available} ${available === 1 ? 'unidade disponível' : 'unidades disponíveis'} nesta edição${inCart ? ` (você já tem ${inCart} no carrinho)` : ''}.`

function validQuantity(value: unknown): number | undefined {
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 ? n : undefined
}

export const cartHandlers = [
  http.get('/api/cart', async ({ request }) => {
    await delay(250)
    const owner = resolveOwner(request)
    if ('error' in owner) return owner.error
    return HttpResponse.json(buildCart(owner.ownerId))
  }),

  http.post('/api/cart/items', async ({ request }) => {
    await delay(300)
    const failure = failureFor('cart')
    if (failure) return failure
    const owner = resolveOwner(request)
    if ('error' in owner) return owner.error

    const body = (await request.json()) as Partial<AddCartItemRequest>
    const quantity = validQuantity(body.quantity)
    if (!quantity) {
      return apiError(400, 'VALIDATION_ERROR', 'Quantidade inválida.', { quantity: 'Informe um número inteiro maior que zero.' })
    }
    const nft = db.nfts.find((n) => n.id === body.nftId)
    if (!nft) return apiError(404, 'NOT_FOUND', 'NFT não encontrado.')
    const edition = nft.editions.find((e) => e.id === body.editionId)
    if (!edition) return apiError(404, 'NOT_FOUND', 'Edição não encontrada.')

    const existing = db.cartItems.find(
      (i) => i.ownerId === owner.ownerId && i.nftId === nft.id && i.editionId === edition.id,
    )
    const wanted = (existing?.quantity ?? 0) + quantity
    if (wanted > edition.available) {
      return apiError(409, 'CONFLICT', stockMessage(edition.available, existing?.quantity ?? 0))
    }
    db.update((s) => {
      const row = existing && s.cartItems.find((i) => i.id === existing.id)
      if (row) row.quantity = wanted
      else s.cartItems.push({ id: newItemId(), ownerId: owner.ownerId, nftId: nft.id, editionId: edition.id, quantity })
    })
    return HttpResponse.json(buildCart(owner.ownerId), { status: 201 })
  }),

  http.patch('/api/cart/items/:itemId', async ({ request, params }) => {
    await delay(250)
    const failure = failureFor('cart')
    if (failure) return failure
    const owner = resolveOwner(request)
    if ('error' in owner) return owner.error

    const item = db.cartItems.find((i) => i.id === String(params.itemId) && i.ownerId === owner.ownerId)
    if (!item) return apiError(404, 'NOT_FOUND', 'Item não encontrado no carrinho.')
    const body = (await request.json()) as { quantity?: unknown }
    const quantity = validQuantity(body.quantity)
    if (!quantity) {
      return apiError(400, 'VALIDATION_ERROR', 'Quantidade inválida.', { quantity: 'Informe um número inteiro maior que zero.' })
    }
    const edition = db.nfts.find((n) => n.id === item.nftId)?.editions.find((e) => e.id === item.editionId)
    if (!edition || quantity > edition.available) {
      return apiError(409, 'CONFLICT', stockMessage(edition?.available ?? 0, 0))
    }
    db.update((s) => {
      const row = s.cartItems.find((i) => i.id === item.id)
      if (row) row.quantity = quantity
    })
    return HttpResponse.json(buildCart(owner.ownerId))
  }),

  // Idempotente: remover um item que não existe mais devolve o carrinho atual.
  http.delete('/api/cart/items/:itemId', async ({ request, params }) => {
    await delay(200)
    const failure = failureFor('cart')
    if (failure) return failure
    const owner = resolveOwner(request)
    if ('error' in owner) return owner.error
    db.update((s) => {
      s.cartItems = s.cartItems.filter((i) => !(i.id === String(params.itemId) && i.ownerId === owner.ownerId))
    })
    return HttpResponse.json(buildCart(owner.ownerId))
  }),

  http.put('/api/cart/coupon', async ({ request }) => {
    await delay(300)
    const failure = failureFor('cart')
    if (failure) return failure
    const owner = resolveOwner(request)
    if ('error' in owner) return owner.error

    const body = (await request.json()) as { code?: unknown }
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
    const rule = COUPONS[code]
    const message = !code ? 'Informe o código do cupom.' : !rule ? 'Cupom inválido.' : rule.expired ? 'Este cupom expirou.' : ''
    if (message) return apiError(400, 'VALIDATION_ERROR', message, { code: message })

    db.update((s) => {
      s.cartCoupons = s.cartCoupons.filter((c) => c.ownerId !== owner.ownerId)
      s.cartCoupons.push({ ownerId: owner.ownerId, code })
    })
    return HttpResponse.json(buildCart(owner.ownerId))
  }),

  http.delete('/api/cart/coupon', async ({ request }) => {
    await delay(200)
    const failure = failureFor('cart')
    if (failure) return failure
    const owner = resolveOwner(request)
    if ('error' in owner) return owner.error
    db.update((s) => {
      s.cartCoupons = s.cartCoupons.filter((c) => c.ownerId !== owner.ownerId)
    })
    return HttpResponse.json(buildCart(owner.ownerId))
  }),

  // Chamado logo após o login: leva os itens do visitante para o carrinho do usuário.
  http.post('/api/cart/merge', async ({ request }) => {
    await delay(300)
    if (!bearerToken(request)) return apiError(401, 'UNAUTHENTICATED', 'Entre para continuar.')
    const auth = authenticate(request)
    if ('error' in auth) return auth.error

    const body = (await request.json()) as { guestId?: unknown }
    const guestId = typeof body.guestId === 'string' ? body.guestId : ''
    if (!/^[\w-]{8,64}$/.test(guestId)) {
      return apiError(400, 'VALIDATION_ERROR', 'Identificação de visitante inválida.')
    }
    const ownerId = `user:${auth.user.id}`
    const guestOwner = `guest:${guestId}`
    let merged = 0

    db.update((s) => {
      for (const g of s.cartItems.filter((i) => i.ownerId === guestOwner)) {
        const edition = s.nfts.find((n) => n.id === g.nftId)?.editions.find((e) => e.id === g.editionId)
        if (!edition) continue
        const mine = s.cartItems.find((i) => i.ownerId === ownerId && i.nftId === g.nftId && i.editionId === g.editionId)
        const base = mine?.quantity ?? 0
        const quantity = Math.min(base + g.quantity, edition.available)
        if (quantity <= base) continue
        if (mine) mine.quantity = quantity
        else s.cartItems.push({ id: newItemId(), ownerId, nftId: g.nftId, editionId: g.editionId, quantity })
        merged += quantity - base
      }
      s.cartItems = s.cartItems.filter((i) => i.ownerId !== guestOwner)
      const guestCoupon = s.cartCoupons.find((c) => c.ownerId === guestOwner)
      if (guestCoupon && !s.cartCoupons.some((c) => c.ownerId === ownerId)) {
        s.cartCoupons.push({ ownerId, code: guestCoupon.code })
      }
      s.cartCoupons = s.cartCoupons.filter((c) => c.ownerId !== guestOwner)
    })

    const body2: MergeCartResponse = { ...buildCart(ownerId), merged }
    return HttpResponse.json(body2)
  }),
]