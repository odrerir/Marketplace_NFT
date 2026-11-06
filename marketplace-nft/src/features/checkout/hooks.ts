import { useQuery } from '@tanstack/react-query'
import { getOrder } from '@/api/orders'
import { getWallets } from '@/api/wallets'
import { useSession } from '@/lib/auth'

export function useWallets() {
  const { user } = useSession()
  return useQuery({
    queryKey: ['wallets', user?.id] as const,
    queryFn: ({ signal }) => getWallets(signal),
    enabled: !!user,
  })
}

/** Enquanto o pedido está pendente, consulta a cada 1,5 s. Recarrega ao voltar a conexão. */
export function useOrder(id: string) {
  const { user } = useSession()
  return useQuery({
    queryKey: ['orders', user?.id, id] as const,
    queryFn: ({ signal }) => getOrder(id, signal),
    enabled: !!user,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 1500 : false),
  })
}