import type { Socket } from 'socket.io-client'
import { REALTIME_URL } from './realtime'

let socketPromise: Promise<Socket> | undefined

/**
 * Import dinâmico: o socket.io-client captura o WebSocket global quando carrega,
 * e o MSW só o substitui em worker.start(). A Promise em cache evita criar dois
 * sockets quando o StrictMode monta o componente duas vezes.
 */
export function getSocket(): Promise<Socket> {
  socketPromise ??= import('socket.io-client').then(({ io }) =>
    io(REALTIME_URL, { transports: ['websocket'], autoConnect: false }),
  )
  return socketPromise
}

/** Chamado no logout e na expiração: a sessão anterior não pode manter subscriptions. */
export function disconnectSocket(): void {
  void socketPromise?.then((socket) => socket.disconnect())
}