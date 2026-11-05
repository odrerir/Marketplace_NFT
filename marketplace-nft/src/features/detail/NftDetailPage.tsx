import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { ArrowLeft, Minus, Plus, ShoppingCart, Star } from 'lucide-react'
import { listNfts, nftQueryOptions } from '@/api/nfts'
import { Footer } from '@/components/Footer'
import { FavoriteButton } from '@/features/favorites/FavoriteButton'
import { NETWORK_LABELS } from '@/features/home/labels'
import { NftCard } from '@/features/home/NftCard'
import { TopNav } from '@/features/home/TopNav'
import { fromWei, toWei } from '@/lib/eth'
import { cn } from '@/lib/utils'
import type { Nft, NftEdition } from '@/types/api'

const route = getRouteApi('/nft/$id')
const stepButton =
  'flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40'

function defaultEdition(nft: Nft): string {
  const preferred = nft.editions.find((e) => e.id === '1/50' && e.available > 0)
  return (preferred ?? nft.editions.find((e) => e.available > 0) ?? nft.editions[0]).id
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="size-4 text-primary" fill={i < Math.round(rating) ? 'currentColor' : 'none'} />
      ))}
    </span>
  )
}

function EditionPicker({ editions, value, onChange }: {
  editions: NftEdition[]
  value: string
  onChange: (edition: NftEdition) => void
}) {
  return (
    <div role="group" aria-labelledby="edicao-label">
      <p id="edicao-label" className="mb-2 text-sm font-bold">Edição:</p>
      <div className="flex flex-wrap gap-2">
        {editions.map((e) => {
          const soldOut = e.available === 0
          return (
            <button
              key={e.id}
              type="button"
              disabled={soldOut}
              aria-pressed={e.id === value}
              aria-label={soldOut ? `${e.label}, esgotada` : e.label}
              onClick={() => onChange(e)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs',
                e.id === value ? 'border-primary text-primary' : 'border-border-soft',
                soldOut && 'line-through opacity-50',
              )}
            >
              {e.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MoreFromCollection({ nft }: { nft: Nft }) {
  const { data } = useQuery({
    queryKey: ['nfts', 'related', nft.collection, nft.id] as const,
    queryFn: ({ signal }) => listNfts({ q: nft.collection, pageSize: 12 }, signal),
  })
  const items = data?.items.filter((n) => n.id !== nft.id).slice(0, 5) ?? []
  if (items.length === 0) return null

  return (
    <section aria-labelledby="mais-colecao" className="mt-12">
      <h2 id="mais-colecao" className="border-b border-border pb-2 text-lg font-bold text-accent-text">
        Mais desta coleção
      </h2>
      <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {items.map((n) => (
          <li key={n.id}><NftCard nft={n} /></li>
        ))}
      </ul>
    </section>
  )
}

function Detail({ nft }: { nft: Nft }) {
  const [imageIndex, setImageIndex] = useState(0)
  const [editionId, setEditionId] = useState(() => defaultEdition(nft))
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    document.title = `${nft.name} | Kurio`
    return () => {
      document.title = 'Kurio'
    }
  }, [nft.name])

  const edition = nft.editions.find((e) => e.id === editionId)
  const max = edition?.available ?? 0
  const soldOut = max === 0
  // Se a disponibilidade cair (ex.: evento em tempo real), a quantidade acompanha
  const qty = Math.max(1, Math.min(quantity, max || 1))
  const total = fromWei(toWei(nft.price) * BigInt(qty))
  const ratingLabel = `Nota ${nft.rating.toFixed(1).replace('.', ',')} de 5, ${nft.reviewCount} avaliações`
  const networkName = NETWORK_LABELS[nft.network]

  function selectEdition(e: NftEdition) {
    setEditionId(e.id)
    setQuantity((q) => Math.min(q, e.available))
  }

  return (
    <>
      <p className="mb-4 hidden text-sm font-bold lg:block">
        <Link to="/">Início</Link> / <span>Mercado</span>
      </p>

      <div className="lg:grid lg:grid-cols-[100px_444px_1fr] lg:gap-7">
        <ul className="hidden space-y-4 lg:block">
          {nft.images.map((src, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setImageIndex(i)}
                aria-label={`Ver imagem ${i + 1}`}
                aria-pressed={i === imageIndex}
                className={cn('block overflow-hidden rounded-[12px] border-2', i === imageIndex ? 'border-primary' : 'border-transparent')}
              >
                <img src={src} alt="" width={100} height={100} className="aspect-square w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>

        <div className="relative rounded-[20px] bg-card p-5">
          <img
            src={nft.images[imageIndex]}
            alt={nft.name}
            width={404}
            height={404}
            fetchPriority="high"
            className="aspect-square w-full rounded-[16px] object-cover"
          />
          <div className="absolute inset-x-8 top-8 flex items-center justify-between lg:hidden">
            <Link to="/" aria-label="Voltar para a Início" className="flex size-10 items-center justify-center rounded-full bg-background/60">
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
            <FavoriteButton nftId={nft.id} variant="icon" />
          </div>
        </div>

        <section aria-label="Informações do NFT" className="mt-6 space-y-4 lg:mt-0">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold">{nft.name}</h1>
            <p className="shrink-0 rounded-full border border-primary px-3 py-1 text-xs lg:hidden">
              <span className="sr-only">{ratingLabel}</span>
              <span aria-hidden="true">★ {nft.rating.toFixed(1)} ({nft.reviewCount})</span>
            </p>
          </div>
          <div className="hidden items-center justify-between border-b border-border pb-3 lg:flex">
            <p className="text-2xl font-bold text-primary">{nft.price} ETH</p>
            <p className="flex items-center gap-2 text-sm">
              <span className="sr-only">{ratingLabel}</span>
              <Stars rating={nft.rating} />
              <span aria-hidden="true">{nft.reviewCount} avaliações de colecionadores</span>
            </p>
          </div>

          <h2 className="text-sm font-bold">Sobre este NFT:</h2>
          <p className="text-sm leading-6 text-muted-foreground">{nft.description}</p>

          <EditionPicker editions={nft.editions} value={editionId} onChange={selectEdition} />

          {/* Mobile: barra fixa embaixo. Desktop: entra no fluxo da página. */}
          <div className="fixed inset-x-0 bottom-0 z-30 rounded-t-[24px] bg-card px-6 pb-6 pt-4 shadow-[0_-10px_30px_#0a060473] lg:static lg:z-auto lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
            <div className="lg:flex lg:items-center lg:justify-between">
              <div className="flex items-center justify-between lg:justify-start">
                <div role="group" aria-label="Quantidade" className="flex items-center gap-3">
                  <span className="text-sm lg:hidden">Qtd.</span>
                  <button type="button" aria-label="Diminuir quantidade" disabled={soldOut || qty <= 1} onClick={() => setQuantity(qty - 1)} className={stepButton}>
                    <Minus className="size-4" aria-hidden="true" />
                  </button>
                  <output aria-live="polite" className="w-6 text-center">{qty}</output>
                  <button type="button" aria-label="Aumentar quantidade" disabled={soldOut || qty >= max} onClick={() => setQuantity(qty + 1)} className={stepButton}>
                    <Plus className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xl font-bold text-primary lg:hidden">{total} ETH</p>
              </div>

              <div className="mt-4 flex gap-3 lg:mt-0">
                {/* Compra e carrinho: ligados na branch feat/cart */}
                <button type="button" disabled className="h-12 flex-1 rounded-[12px] bg-gradient-fab font-bold text-primary-foreground disabled:opacity-60 lg:h-10 lg:flex-none lg:rounded-[4px] lg:bg-primary lg:bg-none lg:px-8 lg:text-sm">
                  <span className="lg:hidden">Comprar NFT</span>
                  <span className="hidden lg:inline">COMPRAR</span>
                </button>
                <button type="button" disabled aria-label="Adicionar ao carrinho" className="flex size-12 items-center justify-center rounded-full bg-secondary opacity-60 lg:hidden">
                  <ShoppingCart className="size-5" aria-hidden="true" />
                </button>
                <FavoriteButton nftId={nft.id} variant="full" className="hidden lg:flex" />
              </div>
            </div>

            <p role="status" className="mt-2 text-xs text-muted-foreground">
              {soldOut
                ? 'Edição esgotada. Escolha outra edição.'
                : qty >= max
                  ? `Limite de ${max} ${max === 1 ? 'unidade' : 'unidades'} nesta edição.`
                  : `${max} disponíveis nesta edição.`}
            </p>
          </div>

          <dl className="space-y-1 text-sm text-muted-foreground">
            <div className="flex gap-1"><dt>ID do token:</dt><dd>#{nft.tokenId}</dd></div>
            <div className="flex gap-1"><dt>Coleção:</dt><dd>{nft.collection}</dd></div>
            <div className="flex gap-1"><dt>Atributos:</dt><dd>{nft.attributes.join(', ')}</dd></div>
          </dl>
        </section>
      </div>

      <section aria-labelledby="detalhes" className="mt-12 hidden lg:block">
        <h2 id="detalhes" className="inline-block border-b-2 border-primary pb-2 font-bold text-primary">Detalhes do NFT</h2>
        <div className="space-y-4 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
          <p>{nft.name} é uma obra digital finalizada à mão da coleção {nft.collection}. Cada atributo fica armazenado nos metadados do token e verificado na {networkName}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.</p>
          <p>A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrado na rede.</p>
          <dl className="space-y-3">
            <div><dt className="font-bold text-foreground">Rede:</dt><dd>Cunhado na {networkName} com procedência imutável e metadados armazenados no IPFS.</dd></div>
            <div><dt className="font-bold text-foreground">Contrato:</dt><dd>0x7A42...19E8 • Contrato inteligente ERC-721 verificado.</dd></div>
            <div><dt className="font-bold text-foreground">Direitos autorais:</dt><dd>Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.</dd></div>
          </dl>
        </div>
      </section>

      <MoreFromCollection nft={nft} />
    </>
  )
}

function DetailSkeleton() {
  return (
    <div aria-hidden="true" className="lg:grid lg:grid-cols-[100px_444px_1fr] lg:gap-7">
      <div className="hidden space-y-4 lg:block">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton aspect-square rounded-[12px]" />)}
      </div>
      <div className="skeleton aspect-square w-full rounded-[20px]" />
      <div className="mt-6 space-y-4 lg:mt-0">
        <div className="skeleton h-8 w-2/3 rounded" />
        <div className="skeleton h-6 w-1/3 rounded" />
        <div className="skeleton h-20 w-full rounded" />
        <div className="skeleton h-8 w-1/2 rounded" />
      </div>
    </div>
  )
}

export function NftDetailPage() {
  const { id } = route.useParams()
  const { data: nft, isPending, isError, error, refetch } = useQuery(nftQueryOptions(id))
  const notFound = isError && isAxiosError(error) && error.response?.status === 404

  return (
    <>
      <TopNav />
      <main className="mx-auto w-full max-w-[1248px] px-6 pb-[200px] pt-6 lg:pb-16">
        {isPending ? (
          <>
            <p role="status" className="sr-only">Carregando NFT</p>
            <DetailSkeleton />
          </>
        ) : isError ? (
          <div role="alert" className="py-16 text-center">
            <h1 className="mb-2 text-xl font-bold">{notFound ? 'NFT não encontrado' : 'Não foi possível carregar o NFT'}</h1>
            <p className="mb-6 text-muted-foreground">
              {notFound ? 'Ele pode ter sido removido ou o endereço está incorreto.' : 'Verifique sua conexão e tente de novo.'}
            </p>
            {notFound ? (
              <Link to="/" className="rounded-[10px] bg-primary px-4 py-2 font-bold text-primary-foreground">Voltar ao início</Link>
            ) : (
              <button type="button" onClick={() => refetch()} className="rounded-[10px] bg-primary px-4 py-2 font-bold text-primary-foreground">Tentar novamente</button>
            )}
          </div>
        ) : (
          <Detail key={nft.id} nft={nft} />
        )}
      </main>
      <Footer />
    </>
  )
}