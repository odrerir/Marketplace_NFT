export type EthAmount = string

export type NftNetwork = 'ethereum' | 'polygon' | 'solana'

export interface Nft {
  id: string
  name: string
  tokenId: string
  collection: string
  network: NftNetwork
  price: EthAmount
  previousPrice?: EthAmount
  isRare: boolean
  version: number
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}