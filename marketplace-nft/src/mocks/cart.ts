import { db } from './db'
import { apiError, authenticate, bearerToken } from './auth'
import { fromWei, toWei } from '@/lib/eth'
import type { CartLine, CartResponse } from '@/types/api'

export const NETWORK_FEE = '0.016'

interface CouponRule {
  description: string
  expired?: boolean
  percent?: bigint
  fixedWei?: bigint
}

export const COUPONS: Record<string, CouponRule> = {
  KURIO10: { description: '10% de desconto', percent: 10n },
  WELCOME: { description: '0.05 ETH de desconto', fixedWei: toWei('0.05') },
  OLD2025: { description: 'Cupom expirado', expired: true },
}

/** Dono do carrinho: o usuário da sessão ou, sem sessão, o visitante (X-Guest-Id). */
export function resolveOwner(request: Request): { ownerId: string } | { error: Response } {
  if (bearerToken(request)) {
    const auth = authenticate(request)
    if ('error' in auth) return { error: auth.error }
    return { ownerId: `user:${auth.user.id}` }
  }
  const guest = request.headers.get('X-Guest-Id') ?? ''
  if (/^[\w-]{8,64}$/.test(guest)) return { ownerId: `guest:${guest}` }
  return { error: apiError(400, 'VALIDATION_ERROR', 'Carrinho de visitante sem identificação.') }
}

function hash(text: string): string {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(16)
}

export function buildCart(ownerId: string): CartResponse {
  const lines: CartLine[] = []
  const fingerprint: unknown[] = []
  let subtotal = 0n

  for (const row of db.cartItems.filter((i) => i.ownerId === ownerId)) {
    const nft = db.nfts.find((n) => n.id === row.nftId)
    const edition = nft?.editions.find((e) => e.id === row.editionId)
    if (!nft || !edition) continue
    const lineTotal = toWei(nft.price) * BigInt(row.quantity)
    subtotal += lineTotal
    lines.push({
      id: row.id,
      nftId: nft.id,
      name: nft.name,
      tokenId: nft.tokenId,
      image: nft.images[0],
      editionId: edition.id,
      editionLabel: edition.label,
      unitPrice: nft.price,
      quantity: row.quantity,
      lineTotal: fromWei(lineTotal),
      available: edition.available,
      unavailable: row.quantity > edition.available,
    })
    fingerprint.push([nft.id, edition.id, row.quantity, nft.price, nft.version, edition.available])
  }

  const code = db.cartCoupons.find((c) => c.ownerId === ownerId)?.code
  const rule = code ? COUPONS[code] : undefined
  let discount = 0n
  if (rule && !rule.expired) {
    discount = rule.percent !== undefined ? (subtotal * rule.percent) / 100n : (rule.fixedWei ?? 0n)
    if (discount > subtotal) discount = subtotal
  }
  const fee = lines.length > 0 ? toWei(NETWORK_FEE) : 0n
  const total = subtotal - discount + fee

  return {
    items: lines,
    coupon: code && rule ? { code, description: rule.description } : undefined,
    subtotal: fromWei(subtotal),
    discount: fromWei(discount),
    networkFee: fromWei(fee),
    total: fromWei(total),
    quoteId: hash(JSON.stringify([fingerprint, code, discount.toString(), fee.toString(), total.toString()])),
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    hasIssues: lines.some((l) => l.unavailable),
  }
}