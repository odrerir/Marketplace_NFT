import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addFavorite, getFavorites, removeFavorite } from '@/api/favorites'
import { useSession } from '@/lib/auth'
import { notify } from '@/lib/notify'
import type { FavoritesResponse } from '@/types/api'

const keyFor = (userId: string | undefined) => ['favorites', userId] as const

export function useFavorites() {
  const { user } = useSession()
  const query = useQuery({
    queryKey: keyFor(user?.id),
    queryFn: getFavorites,
    enabled: !!user,
  })
  return { user, ids: new Set(query.data?.nftIds ?? []) }
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const key = keyFor(user?.id)

  return useMutation({
    mutationFn: ({ nftId, favorite }: { nftId: string; favorite: boolean }) =>
      favorite ? addFavorite(nftId) : removeFavorite(nftId),

    // 1. antes de enviar: guarda o estado atual e já mostra o novo
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoritesResponse>(key)
      const ids = new Set(previous?.nftIds ?? [])
      if (favorite) ids.add(nftId)
      else ids.delete(nftId)
      queryClient.setQueryData<FavoritesResponse>(key, { nftIds: [...ids] })
      return { previous }
    },
    onSuccess: (_data, { favorite }) =>
      notify(favorite ? 'Adicionado aos favoritos.' : 'Removido dos favoritos.', 'success', 3000),
    // 2. se falhar: volta ao estado guardado (rollback) e avisa
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous)
      notify('Não foi possível atualizar seus favoritos. Tente novamente.', 'error')
    },
    // 3. no fim, de qualquer jeito: confere com o servidor
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}