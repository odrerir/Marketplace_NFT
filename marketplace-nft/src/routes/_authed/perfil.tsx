import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { signOut, useSession } from '@/lib/auth'

export const Route = createFileRoute('/_authed/perfil')({ component: ProfilePage })

function ProfilePage() {
  const { user } = useSession()
  const navigate = useNavigate()

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <Link to="/" className="text-sm text-primary">← Início</Link>
      <h1 className="mb-6 mt-4 text-xl font-bold">Perfil do colecionador</h1>
      <dl className="mb-8 space-y-2 text-sm">
        <div><dt className="text-muted-foreground">Nome de usuário</dt><dd>{user?.username}</dd></div>
        <div><dt className="text-muted-foreground">E-mail</dt><dd>{user?.email}</dd></div>
      </dl>
      <button
        type="button"
        onClick={async () => {
          await signOut()
          void navigate({ to: '/' })
        }}
        className="rounded-[8px] bg-primary px-4 py-2 font-bold text-primary-foreground"
      >
        Sair
      </button>
    </main>
  )
}