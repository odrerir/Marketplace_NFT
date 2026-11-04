import { api } from '@/lib/api'
import type { ListNftsParams, Nft, NftListResponse } from '@/types/api'

export async function listNfts(params: ListNftsParams, signal?: AbortSignal) {
  const { data } = await api.get<NftListResponse>('/nfts', { params, signal })
  return data
}

export async function getNft(id: string) {
  const { data } = await api.get<Nft>(`/nfts/${encodeURIComponent(id)}`)
  return data
}