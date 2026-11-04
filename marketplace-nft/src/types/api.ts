/** ETH sempre como string decimal (ex.: "1.19"), nunca number. */
export type EthAmount = string

export type NftNetwork = 'ethereum' | 'polygon' | 'solana'

export type NftCategory =
  | 'arte-digital' | 'fotografia' | 'musica' | 'arte-3d' | 'colecionaveis'
  | 'generativa' | 'jogos' | 'assinaturas' | 'utilidade'

export type NftTab = 'all' | 'new' | 'trending'
export type NftSort = 'recent' | 'price_asc' | 'price_desc'

export interface NftEdition {
  id: string
  label: string
  available: number
}

export interface Nft {
  id: string
  name: string
  tokenId: string
  collection: string
  category: NftCategory
  network: NftNetwork
  price: EthAmount
  previousPrice?: EthAmount
  isRare: boolean
  isNew: boolean
  isTrending: boolean
  listedAt: string
  images: string[]
  description: string
  rating: number
  reviewCount: number
  attributes: string[]
  editions: NftEdition[]
  /** Aumenta a cada alteração; o Socket.IO usa para ignorar eventos antigos. */
  version: number
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface NftFacets {
  categories: Record<string, number>
  networks: Record<string, number>
  /** Menor e maior preço da loja, independente dos filtros. */
  priceRange: { min: EthAmount; max: EthAmount }
}

export interface NftListResponse extends Paginated<Nft> {
  facets: NftFacets
}

export interface ListNftsParams {
  page?: number
  pageSize?: number
  q?: string
  category?: NftCategory
  network?: NftNetwork
  minPrice?: EthAmount
  maxPrice?: EthAmount
  tab?: NftTab
  sort?: NftSort
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TRANSIENT'

export interface ApiError {
  code: ApiErrorCode
  message: string
  fieldErrors?: Record<string, string>
}