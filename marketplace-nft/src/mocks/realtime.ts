import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { REALTIME_URL } from '@/lib/realtime'
import { db } from './db'
import type { Nft, Order } from '@/types/api'

const realtime = ws.link(REALTIME_URL)
const PING_INTERVAL_MS = 20_000
interface Subscriber { socket: ReturnType<typeof toSocketIo>['server']; userId?: string }
const subscribers = new Set<Subscriber>()

function emitFor(emit: Subscriber['socket']['emit'], event: string, payload: unknown, subscriberUserId?: string, expectedUserId?: string) {
  if (subscriberUserId === expectedUserId) emit(event, payload)
}

export function emitNftUpdated(nft: Nft) {
  for (const subscriber of subscribers) {
    if (subscriber.userId) emitFor(subscriber.socket.emit.bind(subscriber.socket), 'nft.updated', {
      eventId: `nft:${nft.id}:${nft.version}`,
      resource: 'nft',
      nftId: nft.id,
      userId: null,
      version: nft.version,
      nft,
    }, subscriber.userId, subscriber.userId)
  }
}

export function emitOrderUpdated(order: Order, userId: string) {
  for (const subscriber of subscribers) {
    if (subscriber.userId === userId) subscriber.socket.emit('order.updated', {
      eventId: `order:${order.id}:${order.version}`,
      resource: 'order',
      orderId: order.id,
      userId,
      version: order.version,
      order,
    })
  }
}

export const realtimeHandlers = [
  realtime.addEventListener('connection', (connection) => {
    const socket = toSocketIo(connection)
    const subscriber: Subscriber = { socket: socket.server }
    subscribers.add(subscriber)

    // O binding não envia o "ping" do Engine.IO (pacote "2"). Sem ele, o cliente
    // considera a conexão morta depois de ~30 s e derruba.
    const ping = setInterval(() => connection.client.send('2'), PING_INTERVAL_MS)
    socket.client.on('subscribe', (_message, payload: { token?: string }) => {
      const session = db.sessions.find((item) => item.token === payload?.token && new Date(item.expiresAt).getTime() > Date.now())
      if (!session) return
      subscriber.userId = session.userId
    })
    socket.client.on('unsubscribe', () => {
      subscriber.userId = undefined
    })
    connection.client.addEventListener('close', () => {
      clearInterval(ping)
      subscribers.delete(subscriber)
    })

  }),
]