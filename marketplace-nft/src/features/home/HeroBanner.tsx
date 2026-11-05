import { ArrowRight } from 'lucide-react'

export function HeroBanner() {
  const explore = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('catalogo')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }
  return (
    <section
      aria-label="Destaque"
      className="relative mt-4 min-h-[190px] overflow-hidden rounded-[12px] bg-raised bg-[url(/banner-bg.svg)] bg-cover bg-center p-4 lg:mt-6 lg:h-[450px] lg:overflow-visible lg:rounded-none lg:bg-transparent lg:bg-none lg:p-0"
    >
      <div className="flex min-h-[158px] w-[calc(100%-146px)] flex-col gap-2.5 lg:h-full lg:min-h-0 lg:w-[calc(100%-490px)] lg:justify-center lg:gap-3 lg:pl-[46px]">
        <p className="text-xs text-muted-foreground lg:text-sm">Bem-vindo à Kurio</p>
        <h1 className="text-lg font-bold uppercase leading-6 lg:max-w-[540px] lg:text-[43px] lg:leading-[70px]">
          <span className="lg:hidden">Seja dono da cultura digital</span>
          <span className="hidden lg:inline">Seja dono do futuro da arte digital</span>
        </h1>
        <p className="text-[13px] leading-5 text-muted-foreground lg:max-w-[560px] lg:text-sm lg:leading-6">
          <span className="lg:hidden">Descubra NFTs selecionados de criadores do mundo todo.</span>
          <span className="hidden lg:inline">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.
          </span>
        </p>
        <button
          type="button"
          onClick={explore}
          className="mt-auto flex w-fit items-center gap-1 text-sm font-bold text-primary lg:mt-4 lg:rounded-[4px] lg:bg-primary lg:px-8 lg:py-2.5 lg:text-primary-foreground"
        >
          EXPLORAR <ArrowRight className="size-4 lg:hidden" aria-hidden="true" />
        </button>
      </div>
      <img
        src="/nfts/ape-green.png"
        alt="NFT em destaque: Emerald Ape #042"
        width={138}
        height={146}
        fetchPriority="high"
        className="absolute right-4 top-2.5 h-[146px] w-[138px] rounded-[16px] object-cover lg:right-0 lg:top-0 lg:h-[450px] lg:w-[450px] lg:rounded-[24px]"
      />
    </section>
  )
}