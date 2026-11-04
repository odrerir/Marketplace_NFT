import { fromWei, toWei } from '@/lib/eth'
import type { ListNftsParams, Nft, NftListResponse } from '@/types/api'

const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

const cmp = (a: bigint, b: bigint) => (a < b ? -1 : a > b ? 1 : 0)

function countBy(items: Nft[], key: 'category' | 'network') {
  const counts: Record<string, number> = {}
  for (const item of items) counts[item[key]] = (counts[item[key]] ?? 0) + 1
  return counts
}

export function queryNfts(all: Nft[], p: ListNftsParams): NftListResponse {
  const page = Math.max(1, p.page ?? 1)
  const pageSize = Math.min(48, Math.max(1, p.pageSize ?? 9))
  const q = p.q ? normalize(p.q) : ''
  const min = p.minPrice ? toWei(p.minPrice) : null
  const max = p.maxPrice ? toWei(p.maxPrice) : null

  const filtered = all.filter((n) => {
    if (q && !normalize(`${n.name} ${n.collection} ${n.tokenId} ${n.category.replace(/-/g, ' ')}`).includes(q)) return false
    if (p.category && n.category !== p.category) return false
    if (p.network && n.network !== p.network) return false
    const price = toWei(n.price)
    if (min !== null && price < min) return false
    if (max !== null && price > max) return false
    if (p.tab === 'new' && !n.isNew) return false
    if (p.tab === 'trending' && !n.isTrending) return false
    return true
  })

  const sort = p.sort ?? 'recent'
  const sorted = [...filtered].sort((a, b) => {
    let result = 0
    if (sort === 'price_asc') result = cmp(toWei(a.price), toWei(b.price))
    else if (sort === 'price_desc') result = cmp(toWei(b.price), toWei(a.price))
    else result = b.listedAt.localeCompare(a.listedAt)
    return result || a.id.localeCompare(b.id) // desempate estável
  })

  const start = (page - 1) * pageSize
  return {
    items: sorted.slice(start, start + pageSize),
    page,
    pageSize,
    total: sorted.length,
    totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
    facets: { categories: countBy(all, 'category'), networks: countBy(all, 'network'), priceRange: priceRange(all)},
  }
}

function priceRange(items: Nft[]) {
  if (items.length === 0) return { min: '0.00', max: '0.00' }
  const wei = items.map((n) => toWei(n.price))
  const min = wei.reduce((a, b) => (b < a ? b : a))
  const max = wei.reduce((a, b) => (b > a ? b : a))
  return { min: fromWei(min), max: fromWei(max) }
}