import { db } from './db'

export const SETTLE_DELAY_MS = 2500

function randomTransactionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return `0x${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Resolve os pedidos pendentes que já venceram. É chamada a cada leitura (carrinho e pedidos),
 * então o resultado não depende de um timer que pode se perder em um refresh.
 * Na confirmação: baixa o estoque e remove do carrinho SÓ o que foi comprado.
 */
export function settleDueOrders(userId: string) {
  const now = Date.now()
  const due = db.orders.filter(
    (o) => o.userId === userId && o.order.status === 'pending' && new Date(o.settleAt).getTime() <= now,
  )
  if (due.length === 0) return

  db.update((s) => {
    const ownerId = `user:${userId}`
    for (const entry of s.orders) {
      if (entry.userId !== userId || entry.order.status !== 'pending') continue
      if (new Date(entry.settleAt).getTime() > now) continue
      const order = entry.order
      order.updatedAt = new Date().toISOString()
      order.version += 1

      if (entry.outcome === 'refused') {
        order.status = 'refused'
        order.refusalReason = 'Pagamento recusado pela carteira. Nenhum valor foi cobrado.'
        continue
      }

      order.status = 'confirmed'
      order.transactionId = randomTransactionId()
      for (const item of order.items) {
        const nft = s.nfts.find((n) => n.id === item.nftId)
        const edition = nft?.editions.find((e) => e.label === item.editionLabel)
        if (nft && edition) {
          edition.available = Math.max(0, edition.available - item.quantity)
          nft.version += 1
        }
        const row = s.cartItems.find(
          (i) => i.ownerId === ownerId && i.nftId === item.nftId && i.editionId === edition?.id,
        )
        if (row) {
          row.quantity -= item.quantity
          if (row.quantity <= 0) s.cartItems = s.cartItems.filter((i) => i.id !== row.id)
        }
      }
      if (!s.cartItems.some((i) => i.ownerId === ownerId)) {
        s.cartCoupons = s.cartCoupons.filter((c) => c.ownerId !== ownerId)
      }
    }
  })
}