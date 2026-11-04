import { useEffect, useRef, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { ArrowRight, Search, SlidersHorizontal } from 'lucide-react'
import { listNfts } from '@/api/nfts'
import { cn } from '@/lib/utils'
import type { NftTab } from '@/types/api'
import { BottomNav } from './BottomNav'
import { NftCard, NftCardSkeleton } from './NftCard'
import type { HomeSearch } from './search'

// getRouteApi evita o import circular entre a rota e este componente
const route = getRouteApi('/')
const PAGE_SIZE = 8

const tabs: { id: NftTab; label: string }[] = [
  { id: 'all', label: 'Todos os NFTs' },
  { id: 'new', label: 'Novos lançamentos' },
  { id: 'trending', label: 'Em alta' },
]

/** Segunda coluna 32 px mais baixa (16 px na 1ª, 48 px na 2ª). translate não afeta o layout. */
const stagger = (i: number) => (i % 2 === 1 ? 'translate-y-8' : '')

function SearchRow({ q, onSearch }: { q?: string; onSearch: (q?: string) => void }) {
  const [value, setValue] = useState(q ?? '')
  const pushed = useRef(q ?? '')

  // A URL mudou por fora (voltar/avançar do navegador): atualiza o campo
  useEffect(() => {
    if ((q ?? '') !== pushed.current) {
      pushed.current = q ?? ''
      setValue(q ?? '')
    }
  }, [q])

  // Só escreve na URL depois de 300 ms sem digitar
  useEffect(() => {
    const next = value.trim()
    if (next === pushed.current) return
    const id = setTimeout(() => {
      pushed.current = next
      onSearch(next || undefined)
    }, 300)
    return () => clearTimeout(id)
  }, [value, onSearch])

  return (
    <div className="flex gap-2">
      <form role="search" className="relative flex-1" onSubmit={(e) => e.preventDefault()}>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-[11.5px] size-[22px] text-muted-foreground" />
        <input
          id="busca"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Explorar coleções"
          aria-label="Buscar NFTs"
          className="h-[45px] w-full rounded-[10px] bg-card pl-[42px] pr-3 text-[15px] font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary"
        />
      </form>
      {/* O drawer de filtros entra na próxima branch */}
      <button
        type="button"
        disabled
        aria-label="Filtros"
        className="flex size-[45px] shrink-0 items-center justify-center rounded-[14px] bg-gradient-filter text-primary-foreground"
      >
        <SlidersHorizontal className="size-[22px]" />
      </button>
    </div>
  )
}

function HeroBanner() {
  const explore = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('catalogo')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }
  return (
    <section
      aria-label="Destaque"
      className="relative mt-4 min-h-[190px] overflow-hidden rounded-[12px] bg-raised bg-cover bg-center p-4"
      style={{ backgroundImage: 'url(/banner-bg.svg)' }}
    >
      <div className="flex min-h-[158px] w-[calc(100%-146px)] flex-col gap-2.5">
        <p className="text-xs text-muted-foreground">Bem-vindo à Kurio</p>
        <h1 className="max-w-[220px] text-xl font-bold uppercase leading-7">Seja dono da cultura digital</h1>
        <p className="max-w-[220px] text-[13px] leading-5 text-muted-foreground">
          Descubra NFTs selecionados de criadores do mundo todo.
        </p>
        <button type="button" onClick={explore} className="mt-auto flex w-fit items-center gap-1 text-sm font-bold text-primary">
          EXPLORAR <ArrowRight className="size-4" aria-hidden="true" />
        </button>
        <img src="/nfts/ape-green.png" alt="NFT em destaque: Emerald Ape #042" width={138} height={146} fetchPriority="high" className="absolute right-4 top-2.5 h-[146px] w-[138px] rounded-[16px] object-cover"
        />
      </div>
    </section>
  )
}

export function HomeMobile() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const page = search.page ?? 1
  const tab = search.tab ?? 'all'

  const params = {
    page,
    pageSize: PAGE_SIZE,
    q: search.q,
    tab,
    sort: search.sort,
    category: search.category,
    network: search.network,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
  }

  const { data, isPending, isError, isFetching, isPlaceholderData, refetch } = useQuery({
    queryKey: ['nfts', 'list', params],
    queryFn: ({ signal }) => listNfts(params, signal),
    placeholderData: keepPreviousData, // mantém a lista antiga na tela enquanto a nova carrega
  })

  // Mudar qualquer filtro reinicia a paginação
  const changeFilter = (patch: Partial<HomeSearch>, replace = false) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }), replace })
  const goToPage = (p: number) =>
    navigate({ search: (prev) => ({ ...prev, page: p > 1 ? p : undefined }) })
  const reset = () => navigate({ search: {} })

  return (
    <>
      <main className="px-6 pb-[calc(94.95px+2rem)] pt-6">
        <SearchRow q={search.q} onSearch={(q) => changeFilter({ q }, true)} />
        <HeroBanner />

        <div id="catalogo" role="group" aria-label="Filtrar NFTs" className="mt-6 flex gap-3 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tab === t.id}
              onClick={() => changeFilter({ tab: t.id === 'all' ? undefined : t.id })}
              className={cn(
                'shrink-0 whitespace-nowrap border-b-2 pb-1 text-sm font-medium',
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p role="status" className="sr-only">{isFetching ? 'Carregando NFTs' : ''}</p>

        <section aria-busy={isFetching} className={cn('pt-4 transition-opacity', isPlaceholderData && 'opacity-60')}>
          {isPending ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-5 pb-8">
              {Array.from({ length: 4 }, (_, i) => (
                <li key={i} className={stagger(i)}><NftCardSkeleton /></li>
              ))}
            </ul>
          ) : isError ? (
            <div role="alert" className="py-12 text-center">
              <p className="mb-4">Não foi possível carregar os NFTs.</p>
              <button type="button" onClick={() => refetch()} className="rounded-[10px] bg-primary px-4 py-2 font-bold text-primary-foreground">
                Tentar novamente
              </button>
            </div>
          ) : data.items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="mb-4">
                {data.total > 0 ? 'Esta página não existe.' : 'Nenhum NFT encontrado.'}
              </p>
              <button type="button" onClick={reset} className="rounded-[10px] bg-primary px-4 py-2 font-bold text-primary-foreground">
                Limpar busca
              </button>
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-5 pb-8">
                {data.items.map((nft, i) => (
                  <li key={nft.id} className={stagger(i)}><NftCard nft={nft} /></li>
                ))}
              </ul>
              {data.totalPages > 1 && (
                <nav aria-label="Paginação" className="flex items-center justify-between pt-8 text-sm">
                  <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)} className="py-2 font-bold text-primary disabled:opacity-40">
                    Anterior
                  </button>
                  <span aria-live="polite">Página {data.page} de {data.totalPages}</span>
                  <button type="button" disabled={page >= data.totalPages} onClick={() => goToPage(page + 1)} className="py-2 font-bold text-primary disabled:opacity-40">
                    Próxima
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </main>
      <BottomNav />
    </>
  )
}