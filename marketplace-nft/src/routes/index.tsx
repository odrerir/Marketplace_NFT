import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { listNfts } from '@/api/nfts'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['nfts', { page: 1, pageSize: 9 }],
    queryFn: () => listNfts({ page: 1, pageSize: 9 }),
  })

  if (isPending) return <p className="p-8">Carregando...</p>
  if (isError)
    return (
      <p className="p-8">
        Erro ao carregar. <button onClick={() => refetch()}>Tentar novamente</button>
      </p>
    )

  return (
    <ul className="p-8">
      {data.items.map((n) => (
        <li key={n.id}>{n.name} · {n.price} ETH</li>
      ))}
    </ul>
  )
}