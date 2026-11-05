import type { ReactNode } from 'react'
import { Link, useSearch } from '@tanstack/react-router'

export function AuthShell({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  const { redirect } = useSearch({ strict: false })
  const tab = 'border-b-2 pb-1 text-lg font-bold'

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-[500px] rounded-[12px] border-b-[6px] border-primary bg-card px-6 pb-8 pt-10 sm:px-12">
        <Link to="/" className="mb-8 block text-center text-3xl font-bold tracking-[0.2em]">
          KURIO
        </Link>
        <nav aria-label="Entrar ou criar conta" className="mb-3 flex justify-center gap-6">
          <Link to="/login" search={{ redirect }} className={tab} activeProps={{ className: `${tab} border-primary text-primary`, 'aria-current': 'page' }} inactiveProps={{ className: `${tab} border-transparent` }}>
            Entrar
          </Link>
          <Link to="/cadastro" search={{ redirect }} className={tab} activeProps={{ className: `${tab} border-primary text-primary`, 'aria-current': 'page' }} inactiveProps={{ className: `${tab} border-transparent` }}>
            Criar conta
          </Link>
        </nav>
        <p className="mb-6 text-center text-sm text-muted-foreground">{subtitle}</p>
        {children}
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          Ou continue com
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-3">
          {['Google', 'Facebook'].map((provider) => (
            <button key={provider} type="button" disabled className="h-10 w-full rounded-[8px] border border-border text-sm opacity-60">
              Continuar com {provider}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">Login social indisponível nesta demonstração.</p>
      </div>
    </main>
  )
}