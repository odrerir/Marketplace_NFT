import { api } from '@/lib/api'
import type { CreateOrderRequest, Order } from '@/types/api'

export async function createOrder(body: CreateOrderRequest, idempotencyKey: string) {
  const { data } = await api.post<Order>('/orders', body, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return data
}

export async function getOrder(id: string, signal?: AbortSignal) {
  const { data } = await api.get<Order>(`/orders/${encodeURIComponent(id)}`, { signal })
  return data
}

/** Recupera um pedido criado cuja resposta se perdeu. */
export async function findOrderByKey(idempotencyKey: string) {
  const { data } = await api.get<{ items: Order[] }>('/orders', { params: { idempotencyKey } })
  return data.items[0]
}