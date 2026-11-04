import { http, HttpResponse, delay } from 'msw'
import { nfts } from './fixtures/nfts'
import type { Nft, Paginated } from '@/types/api'

export const handlers = [
  http.get('/api/nfts', async ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const pageSize = Number(url.searchParams.get('pageSize') ?? 9)

    await delay(600) // simula latência de rede

    const start = (page - 1) * pageSize
    const body: Paginated<Nft> = {
      items: nfts.slice(start, start + pageSize),
      page,
      pageSize,
      total: nfts.length,
      totalPages: Math.max(1, Math.ceil(nfts.length / pageSize)),
    }
    return HttpResponse.json(body)
  }),
]