import { ArrowRight } from 'lucide-react'

export function HeroBanner() {
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