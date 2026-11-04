import { http, HttpResponse, delay } from 'msw'
import { db } from './db'
import { queryNfts } from './queries'
import type { ApiError, ListNftsParams } from '@/types/api'

const num = (v: string | null) => (v ? Number(v) : undefined)

function parseListParams(sp: URLSearchParams): ListNftsParams {
  return {
    page: num(sp.get('page')),
    pageSize: num(sp.get('pageSize')),
    q: sp.get('q') ?? undefined,
    category: (sp.get('category') ?? undefined) as ListNftsParams['category'],
    network: (sp.get('network') ?? undefined) as ListNftsParams['network'],
    minPrice: sp.get('minPrice') ?? undefined,
    maxPrice: sp.get('maxPrice') ?? undefined,
    tab: (sp.get('tab') ?? undefined) as ListNftsParams['tab'],
    sort: (sp.get('sort') ?? undefined) as ListNftsParams['sort'],
  }
}

export const handlers = [
  http.get('/api/nfts', async ({ request }) => {
    const params = parseListParams(new URL(request.url).searchParams)
    await delay(400)
    return HttpResponse.json(queryNfts(db.nfts, params))
  }),

  http.get('/api/nfts/:id', async ({ params }) => {
    await delay(300)
    const nft = db.nfts.find((n) => n.id === params.id)
    if (!nft) {
      const body: ApiError = { code: 'NOT_FOUND', message: 'NFT não encontrado.' }
      return HttpResponse.json(body, { status: 404 })
    }
    return HttpResponse.json(nft)
  }),
]