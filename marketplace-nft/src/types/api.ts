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
  | 'INVALID_CREDENTIALS'
  | 'QUOTE_CHANGED'

export interface ApiError {
  code: ApiErrorCode
  message: string
  fieldErrors?: Record<string, string>
  cart?: CartResponse
}

export interface User {
  id: string
  username: string
  displayName: string
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
  expiresAt: string
}

export interface SessionResponse {
  user: User
  expiresAt: string
}

export interface FavoritesResponse {
  nftIds: string[]
}

export interface CartLine {
  id: string
  nftId: string
  name: string
  tokenId: string
  image: string
  editionId: string
  editionLabel: string
  unitPrice: EthAmount
  quantity: number
  lineTotal: EthAmount
  available: number
  /** A quantidade passou do disponível (ex.: a edição esgotou). */
  unavailable: boolean
}

export interface CartCoupon {
  code: string
  description: string
}

export interface CartResponse {
  items: CartLine[]
  coupon?: CartCoupon
  subtotal: EthAmount
  discount: EthAmount
  networkFee: EthAmount
  total: EthAmount
  /** Identifica esta cotação; o pagamento confere se ainda é a mesma. */
  quoteId: string
  itemCount: number
  hasIssues: boolean
}

export interface MergeCartResponse extends CartResponse {
  merged: number
}

export interface AddCartItemRequest {
  nftId: string
  editionId: string
  quantity: number
}

export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase'
export type WalletKind = 'primary' | 'secondary'

export interface Wallet {
  id: string
  kind: WalletKind
  nickname: string
  network: NftNetwork
  address: string
}

export interface WalletInput {
  kind: WalletKind
  nickname: string
  network: NftNetwork
  address: string
}

export interface WalletConnection {
  id: string
  walletId: string
  provider: WalletProvider
  connectedAt: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'refused'

export interface OrderItem {
  nftId: string
  name: string
  tokenId: string
  image: string
  editionLabel: string
  unitPrice: EthAmount
  quantity: number
  lineTotal: EthAmount
}

export interface OrderCollector {
  displayName: string
  email: string
  note?: string
}

export interface Order {
  id: string
  status: OrderStatus
  items: OrderItem[]
  couponCode?: string
  subtotal: EthAmount
  discount: EthAmount
  networkFee: EthAmount
  total: EthAmount
  network: NftNetwork
  walletProvider: WalletProvider
  walletNickname: string
  walletAddress: string
  collector: OrderCollector
  transactionId?: string
  refusalReason?: string
  createdAt: string
  updatedAt: string
  /** Aumenta a cada mudança de estado (o tempo real usa para ignorar eventos antigos). */
  version: number
}

export interface CreateOrderRequest {
  quoteId: string
  walletId: string
  connectionId: string
  collector: OrderCollector
}