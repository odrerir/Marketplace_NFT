import type { Nft } from '@/types/api'

export function NftCard({ nft }: { nft: Nft }) {
  return (
    <article>
      <div className="relative rounded-[20px] bg-card px-1 pb-5 pt-3">
        <img
          src={nft.images[0]}
          alt={nft.name}
          width={168}
          height={168}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full rounded-[16px] object-cover"
        />
        {nft.isRare && (
          <span className="absolute left-0 top-4 bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            RARO
          </span>
        )}
      </div>
      <div className="mt-2 px-2">
        <h2 className="truncate text-sm">{nft.name}</h2>
        <p className="text-base font-bold text-primary">
          {nft.price} ETH
          {nft.previousPrice && (
            <s className="ml-2 text-sm font-normal text-muted-foreground">
              {nft.previousPrice} ETH
            </s>
          )}
        </p>
      </div>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton aspect-[175/200] rounded-[20px]" />
      <div className="mt-2 space-y-2 px-2">
        <div className="skeleton h-4 w-3/4 rounded-[4px]" />
        <div className="skeleton h-5 w-1/2 rounded-[4px]" />
      </div>
    </div>
  )
}