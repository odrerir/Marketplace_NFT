import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addCartItem, applyCoupon, getCart, removeCartItem, removeCoupon, updateCartItem } from '@/api/cart'
import { useSession } from '@/lib/auth'
import { errorMessage } from '@/lib/errors'
import { notify } from '@/lib/notify'
import type { CartResponse } from '@/types/api'

/** O carrinho do usuário e o do visitante têm chaves de cache diferentes. */
export function useCart() {
  const { user, isPending } = useSession()
  return useQuery({
    queryKey: ['cart', user?.id ?? 'guest'] as const,
    queryFn: ({ signal }) => getCart(signal),
    enabled: !isPending,
  })
}

export function useCartMutations() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const key = ['cart', user?.id ?? 'guest'] as const
  const onSuccess = (cart: CartResponse) => queryClient.setQueryData(key, cart)
  const onError = (error: unknown) => notify(errorMessage(error), 'error')

  return {
    add: useMutation({ mutationFn: addCartItem, onSuccess, onError }),
    update: useMutation({ mutationFn: updateCartItem, onSuccess, onError }),
    remove: useMutation({
      mutationFn: removeCartItem,
      onSuccess: (cart) => {
        onSuccess(cart)
        notify('Item removido do carrinho.', 'info', 3000)
      },
      onError,
    }),
    // o erro do cupom aparece no próprio formulário
    coupon: useMutation({ mutationFn: applyCoupon, onSuccess }),
    clearCoupon: useMutation({ mutationFn: removeCoupon, onSuccess, onError }),
  }
}