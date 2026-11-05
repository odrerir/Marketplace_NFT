import { http, HttpResponse, delay } from 'msw'
import { db } from './db'
import { apiError, authenticate } from './auth'
import { failureFor } from './scenarios'
import type { FavoritesResponse } from '@/types/api'

export const favoritesHandlers = [
  http.get('/api/favorites', async ({ request }) => {
    await delay(200)
    const auth = authenticate(request)
    if ('error' in auth) return auth.error
    const body: FavoritesResponse = {
      nftIds: db.favorites.filter((f) => f.userId === auth.user.id).map((f) => f.nftId),
    }
    return HttpResponse.json(body)
  }),

  http.put('/api/favorites/:nftId', async ({ request, params }) => {
    await delay(300)
    const failure = failureFor('favorites')
    if (failure) return failure
    const auth = authenticate(request)
    if ('error' in auth) return auth.error

    const nftId = String(params.nftId)
    if (!db.nfts.some((n) => n.id === nftId)) return apiError(404, 'NOT_FOUND', 'NFT não encontrado.')
    if (!db.favorites.some((f) => f.userId === auth.user.id && f.nftId === nftId)) {
      db.update((s) => {
        s.favorites.push({ userId: auth.user.id, nftId })
      })
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('/api/favorites/:nftId', async ({ request, params }) => {
    await delay(300)
    const failure = failureFor('favorites')
    if (failure) return failure
    const auth = authenticate(request)
    if ('error' in auth) return auth.error

    const nftId = String(params.nftId)
    db.update((s) => {
      s.favorites = s.favorites.filter((f) => !(f.userId === auth.user.id && f.nftId === nftId))
    })
    return new HttpResponse(null, { status: 204 })
  }),
]