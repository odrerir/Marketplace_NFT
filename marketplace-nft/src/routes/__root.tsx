import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { Notifier } from '@/components/Notifier'

function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço que você acessou não existe ou foi removido.</p>
      <Link to="/" className="rounded-[8px] bg-primary px-4 py-2 font-bold text-primary-foreground">
        Voltar ao início
      </Link>
    </main>
  )
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => (
    <>
      <Outlet />
      <Notifier />
    </>
  ),
  notFoundComponent: NotFound,
})