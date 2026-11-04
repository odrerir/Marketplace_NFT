import { Link } from '@tanstack/react-router'
import { LogIn, ShoppingCart } from 'lucide-react'

const soon = ['Mercado', 'Criadores', 'Aprenda']

export function TopNav() {
  return (
    <header className="hidden border-b border-border lg:block">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-6">
        <Link to="/" className="text-sm font-bold tracking-[0.2em]">KURIO</Link>
        <nav aria-label="Principal">
          <ul className="flex items-center gap-10 text-[15px]">
            <li>
              <Link to="/" aria-current="page" className="border-b-2 border-primary py-5 font-bold text-primary">
                Início
              </Link>
            </li>
            {soon.map((label) => (
              <li key={label} title="Em breve" className="text-muted-foreground opacity-60">{label}</li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-4">
          <button type="button" disabled aria-label="Carrinho" className="opacity-60">
            <ShoppingCart className="size-6" />
          </button>
          <button type="button" disabled className="flex items-center gap-2 rounded-[8px] bg-primary px-4 py-2 text-sm font-bold text-primary-foreground opacity-60">
            <LogIn className="size-4" aria-hidden="true" /> Entrar
          </button>
        </div>
      </div>
    </header>
  )
}