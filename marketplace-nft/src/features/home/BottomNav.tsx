import { Fragment } from 'react'
import { Link } from '@tanstack/react-router'
import { Heart, House, ScanLine, ShoppingCart, User } from 'lucide-react'
import { useSession } from '@/lib/auth'
import { useCart } from '@/features/cart/useCart'

const items = [
  { id: 'home', label: 'Início', icon: House, filled: true },
  { id: 'favorites', label: 'Favoritos', icon: Heart, filled: true },
  { id: 'cart', label: 'Carrinho', icon: ShoppingCart, filled: false },
  { id: 'profile', label: 'Perfil', icon: User, filled: true },
]

// Recorte circular de 47 px de raio, centrado na borda de cima da barra.
const notch = 'radial-gradient(circle 47px at 50% 0, transparent 46.5px, #000 47px)'

function focusSearch() {
  window.scrollTo({ top: 0 })
  document.getElementById('busca')?.focus()
}

export function BottomNav() {
  const { user } = useSession()
  const { data: cart } = useCart()
  const count = cart?.itemCount ?? 0
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 h-[94.95px]"
      style={{ filter: 'drop-shadow(0 -10px 30px #0a060473)' }}
    >
      <nav
        aria-label="Navegação principal"
        className="h-full rounded-[40px] bg-card pt-10"
        style={{ maskImage: notch, WebkitMaskImage: notch }}
      >
        {/* pt-10 = 40 px até o ícone; ícones de 20 px; sobram 34,95 px embaixo */}
        <ul className="flex h-5 items-center justify-between pl-9 pr-10">
          {items.map((item, i) => {
            const Icon = item.icon
            const icon = <Icon className="size-6" fill={item.filled ? 'currentColor' : 'none'} />
            return (
              <Fragment key={item.id}>
                {i === 2 && <li aria-hidden="true" className="w-[65px]" />}
                {item.id === 'home' ? (
                  <Link to="/" aria-label={item.label} aria-current="page" className="-m-3 flex p-3 text-primary">
                    {icon}
                  </Link>
                ) : item.id === 'cart' ? (
                  <Link to="/carrinho" aria-label={count ? `Carrinho, ${count} itens` : 'Carrinho'} className="relative -m-3 flex p-3 text-muted-foreground">
                    {icon}
                    {count > 0 && (
                      <span aria-hidden="true" className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {count}
                      </span>
                    )}
                  </Link>
                ) : item.id === 'profile' ? (
                  <Link to={user ? '/perfil' : '/login'} aria-label={user ? 'Perfil' : 'Entrar'} className="-m-3 flex p-3 text-muted-foreground">
                    {icon}
                  </Link>
                ) : (
                  <button type="button" disabled aria-label={item.label} className="-m-3 flex p-3 text-muted-foreground opacity-60">
                    {icon}
                  </button>
                )}
              </Fragment> 
            )
          })}
        </ul>
      </nav>

      <button
        type="button"
        onClick={focusSearch}
        aria-label="Ir para a busca"
        className="absolute left-1/2 top-0 flex size-[65px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-fab text-foreground"
      >
        <ScanLine className="size-7" />
      </button>
    </div>
  )
}