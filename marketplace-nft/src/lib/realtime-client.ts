import { useEffect } from 'react'
import { getCart } from '@/api/cart'
import { getNft } from '@/api/nfts'
import { listOrders } from '@/api/orders'
import { queryClient } from '@/lib/query-client'
import { getSocket } from '@/lib/socket'
import { getToken } from '@/lib/session'
import type { Nft, NftListResponse, Order } from '@/types/api'

interface NftUpdated {
  eventId: string
  resource: 'nft'
  nftId: string
  version: number
  nft: Nft
}

interface OrderUpdated {
  eventId: string
  resource: 'order'
  orderId: string
  userId: string
  version: number
  order: Order
}

export function isVersionNewer(incoming: number, current: number) {
  return incoming > current
}

export function isOrderEventForUser(
  event: OrderUpdated,
  sessionUser: { id: string } | undefined,
  orderId: string,
) {
  return Boolean(
    sessionUser &&
    event.resource === 'order' &&
    event.userId === sessionUser.id &&
    event.orderId === orderId &&
    event.order.id === orderId,
  )
}

const nftVersions = new Map<string, number>()
const orderVersions = new Map<string, number>()
const appliedEvents = new Set<string>()

function applyNft(nft: Nft) {
  if (nft.version <= (nftVersions.get(nft.id) ?? 0)) return
  nftVersions.set(nft.id, nft.version)

  queryClient.setQueryData(['nfts', 'detail', nft.id], (current: Nft | undefined) =>
    !current || nft.version >= current.version ? nft : current,
  )
  queryClient.setQueriesData<NftListResponse>({ queryKey: ['nfts', 'list'] }, (current) => {
    if (!current) return current
    return {
      ...current,
      items: current.items.map((item) =>
        item.id === nft.id && nft.version > item.version ? nft : item,
      ),
    }
  })

  const sessionUser = queryClient.getQueryData<{ id: string }>(['session'])
  void getCart().then((cart) =>
    queryClient.setQueryData(['cart', sessionUser?.id ?? 'guest'], cart),
  )
  void getNft(nft.id).then((fresh) =>
    queryClient.setQueryData(['nfts', 'detail', nft.id], fresh),
  )
}

function applyOrder(order: Order) {
  const previous = orderVersions.get(order.id) ?? 0
  if (!isVersionNewer(order.version, previous)) return
  orderVersions.set(order.id, order.version)

  const sessionUser = queryClient.getQueryData<{ id: string }>(['session'])
  if (!sessionUser) return
  const key = ['orders', sessionUser.id, order.id] as const
  queryClient.setQueryData(key, (current: Order | undefined) =>
    !current || order.version >= current.version ? order : current,
  )
}

export function RealtimeClient() {
  useEffect(() => {
    let alive = true
    let socket: Awaited<ReturnType<typeof getSocket>> | undefined
    let onNftUpdated: ((event: NftUpdated) => void) | undefined
    let onOrderUpdated: ((event: OrderUpdated) => void) | undefined
    let onConnect: (() => void) | undefined

    void getSocket().then((instance) => {
      if (!alive) return
      socket = instance

      const reconcile = () => {
        if (!getToken()) return
        instance.emit('subscribe', { token: getToken() })
        void Promise.all([getCart(), listOrders()]).then(([cart, orders]) => {
          if (!alive) return
          const sessionUser = queryClient.getQueryData<{ id: string }>(['session'])
          if (!sessionUser) return
          queryClient.setQueryData(['cart', sessionUser.id], cart)
          for (const order of orders) {
            const key = ['orders', sessionUser.id, order.id] as const
            const current = queryClient.getQueryData<Order>(key)
            if (!current || order.version >= current.version) {
              queryClient.setQueryData(key, order)
            }
          }
        })
      }

      onNftUpdated = (event) => {
        if (appliedEvents.has(event.eventId)) return
        appliedEvents.add(event.eventId)
        if (event.resource === 'nft' && event.nftId === event.nft.id) {
          applyNft(event.nft)
        }
      }

      onOrderUpdated = (event) => {
        if (appliedEvents.has(event.eventId)) return
        appliedEvents.add(event.eventId)
        const sessionUser = queryClient.getQueryData<{ id: string }>(['session'])
        if (isOrderEventForUser(event, sessionUser, event.order.id)) {
          applyOrder(event.order)
        }
      }

      onConnect = () => reconcile()
      instance.on('nft.updated', onNftUpdated)
      instance.on('order.updated', onOrderUpdated)
      instance.on('connect', onConnect)
      instance.connected ? reconcile() : instance.connect()
    })

    return () => {
      alive = false
      socket?.emit('unsubscribe')
      if (onNftUpdated) socket?.off('nft.updated', onNftUpdated)
      if (onOrderUpdated) socket?.off('order.updated', onOrderUpdated)
      if (onConnect) socket?.off('connect', onConnect)
    }
  }, [])

  return null
}
