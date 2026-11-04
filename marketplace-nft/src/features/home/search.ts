import type { NftCategory, NftNetwork, NftSort, NftTab } from '@/types/api'

export interface HomeSearch {
  q?: string
  tab?: NftTab
  sort?: NftSort
  page?: number
  category?: NftCategory
  network?: NftNetwork
  minPrice?: string
  maxPrice?: string
}

const CATEGORIES: readonly NftCategory[] = [
  'arte-digital', 'fotografia', 'musica', 'arte-3d', 'colecionaveis',
  'generativa', 'jogos', 'assinaturas', 'utilidade',
]
const NETWORKS: readonly NftNetwork[] = ['ethereum', 'polygon', 'solana']

function pick<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined
}

function price(value: unknown): string | undefined {
  return typeof value === 'string' && /^\d+(\.\d{1,18})?$/.test(value) ? value : undefined
}

export function parseHomeSearch(search: Record<string, unknown>): HomeSearch {
  const page = Number(search.page)
  // "?q=123" chega como número, então aceitamos os dois tipos
  const rawQ =
    typeof search.q === 'string' || typeof search.q === 'number' ? String(search.q).trim() : ''

  return {
    q: rawQ || undefined,
    tab: pick(search.tab, ['new', 'trending'] as const), // "all" é o padrão, sem parâmetro
    sort: pick(search.sort, ['price_asc', 'price_desc'] as const), // "recent" é o padrão
    page: Number.isInteger(page) && page > 1 ? page : undefined,
    category: pick(search.category, CATEGORIES),
    network: pick(search.network, NETWORKS),
    minPrice: price(search.minPrice),
    maxPrice: price(search.maxPrice),
  }
}