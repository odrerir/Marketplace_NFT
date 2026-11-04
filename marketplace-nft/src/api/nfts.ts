import { api } from '@/lib/api'
import type { Nft, Paginated } from '@/types/api'

export async function listNfts(params: { page: number; pageSize: number }) {
  const { data } = await api.get<Paginated<Nft>>('/nfts', { params })
  return data
}