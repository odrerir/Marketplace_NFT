import { useQuery } from '@tanstack/react-query'
import type { Query } from '@tanstack/react-query'
import type { AnyRouter } from '@tanstack/react-router'
import { logout, sessionQueryOptions } from '@/api/auth'
import { notify } from './notify'
import { queryClient } from './query-client'
import { clearToken, onSessionExpired, setToken } from './session'
import { disconnectSocket } from './socket'
import type { AuthResponse } from '@/types/api'
import { mergeCart } from '@/api/cart'
import { getGuestId } from './guest'
import { clearAttempt } from './checkout-attempt'

const notSession = (q: Query) => q.queryKey[0] !== 'session'

/** Leva o carrinho do visitante para a conta que acabou de entrar. */
async function mergeGuestCart() {
  try {
    const result = await mergeCart(getGuestId())
    if (result.merged > 0) notify('Os itens do seu carrinho foram mantidos.', 'success')
  } catch {
    // o carrinho do visitante continua guardado no servidor
  }
  void queryClient.invalidateQueries({ queryKey: ['cart'] })
}

/** Descarta tudo o que é da sessão anterior: caches, requisições em voo e o socket. */
export function resetSessionState() {
  void queryClient.cancelQueries({ predicate: notSession })
  queryClient.removeQueries({ predicate: notSession })
  queryClient.setQueryData(['session'], null)
  disconnectSocket()
  clearAttempt()
}

/** Login e cadastro. Limpar antes cobre também a troca direta de usuário. */
export function startSession({ token, user }: AuthResponse) {
  resetSessionState()
  setToken(token)
  queryClient.setQueryData(['session'], user)
  void mergeGuestCart()
}

export async function signOut() {
  try {
    await logout()
  } catch {
    // o token local é descartado de qualquer forma
  }
  clearToken()
  resetSessionState()
}

export function useSession() {
  const { data, isPending } = useQuery(sessionQueryOptions())
  return { user: data ?? null, isPending }
}

/** Só aceita caminhos internos, para o parâmetro "redirect" não virar redirecionamento aberto. */
export function safeRedirect(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : '/'
}

/** Instalado antes da primeira renderização, para não perder a expiração do carregamento inicial. */
export function installSessionExpiry(router: AnyRouter) {
  return onSessionExpired(() => {
    resetSessionState()
    notify('Sua sessão expirou. Entre novamente para continuar.', 'error')
    // Em página privada, voltamos ao login com o caminho atual para retomar depois.
    // No carregamento inicial quem redireciona é o beforeLoad da rota privada.
    const onPrivatePage = router.state.matches.some((m) => m.routeId.startsWith('/_authed'))
    if (onPrivatePage) {
      void router.navigate({ to: '/login', 
        search: { redirect: router.state.location.href }
    })
    }
  })
}

