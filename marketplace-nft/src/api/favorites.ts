import { api } from '@/lib/api'
import type { FavoritesResponse } from '@/types/api'

export async function getFavorites() {
  const { data } = await api.get<FavoritesResponse>('/favorites')
  return data
}

export async function addFavorite(nftId: string) {
  await api.put(`/favorites/${encodeURIComponent(nftId)}`)
}

export async function removeFavorite(nftId: string) {
  await api.delete(`/favorites/${encodeURIComponent(nftId)}`)
}