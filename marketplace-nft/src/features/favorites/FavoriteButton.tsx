import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { useFavorites, useToggleFavorite } from './useFavorites'

export function FavoriteButton({ nftId, variant, className }: {
  nftId: string
  variant: 'full' | 'icon'
  className?: string
}) {
  const { user, ids } = useFavorites()
  const toggle = useToggleFavorite()
  const navigate = useNavigate()
  const href = useRouterState({ select: (s) => s.location.href })
  const active = ids.has(nftId)

  function onClick() {
    if (!user) {
      notify('Entre na sua conta para favoritar NFTs.', 'info')
      void navigate({ to: '/login', search: { redirect: href } })
      return
    }
    toggle.mutate({ nftId, favorite: !active })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={variant === 'icon' ? (active ? 'Remover dos favoritos' : 'Favoritar') : undefined}
      disabled={toggle.isPending}
      className={cn(
        variant === 'full'
          ? 'flex h-10 items-center gap-2 rounded-[4px] border border-primary px-4 text-sm font-bold text-primary'
          : 'flex size-10 items-center justify-center rounded-full bg-background/60 text-primary',
        'disabled:opacity-70',
        className,
      )}
    >
      <Heart className="size-5" fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
      {variant === 'full' && <span>Favoritar</span>}
    </button>
  )
}