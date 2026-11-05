import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { LogIn, Search, ShoppingCart, X } from 'lucide-react'
import { SearchInput } from './searchInput'

const soon = ['Mercado', 'Criadores', 'Aprenda']

export function TopNav({ q, onSearch }: { q?: string; onSearch: (q?: string) => void }) {
  const [opened, setOpened] = useState(false)
  // Se a URL já tem uma busca (?q=...), o campo aparece aberto
  const open = opened || !!q

  function toggle() {
    if (q) onSearch(undefined)
    setOpened(!open)
  }

  return (
    <header className="hidden lg:block">
      <div className="mx-auto flex h-[68px] max-w-[1248px] items-center justify-between border-b border-border px-6">
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
          {open && (
            <form role="search" onSubmit={(e) => e.preventDefault()}>
              <SearchInput
                id="busca-desktop"
                q={q}
                onSearch={onSearch}
                autoFocus={opened}
                placeholder="Buscar NFTs"
                aria-label="Buscar NFTs"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') toggle()
                }}
                className="h-10 w-64 rounded-[10px] bg-card px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary"
              />
            </form>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label={open ? 'Fechar busca' : 'Abrir busca'}
            aria-expanded={open}
            className="flex size-10 items-center justify-center rounded-md hover:bg-secondary"
          >
            {open ? <X className="size-6" /> : <Search className="size-6" />}
          </button>
          <button type="button" disabled aria-label="Carrinho">
            <ShoppingCart className="size-6" />
          </button>
          <button type="button" disabled className="flex items-center gap-2 rounded-[8px] bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
            <LogIn className="size-4" aria-hidden="true" /> Entrar
          </button>
        </div>
      </div>
    </header>
  )
}