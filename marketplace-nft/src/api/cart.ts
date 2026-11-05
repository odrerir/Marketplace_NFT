import { api } from '@/lib/api'
import type { AddCartItemRequest, CartResponse, MergeCartResponse } from '@/types/api'

export async function getCart(signal?: AbortSignal) {
  const { data } = await api.get<CartResponse>('/cart', { signal })
  return data
}

export async function addCartItem(body: AddCartItemRequest) {
  const { data } = await api.post<CartResponse>('/cart/items', body)
  return data
}

export async function updateCartItem({ id, quantity }: { id: string; quantity: number }) {
  const { data } = await api.patch<CartResponse>(`/cart/items/${encodeURIComponent(id)}`, { quantity })
  return data
}

export async function removeCartItem(id: string) {
  const { data } = await api.delete<CartResponse>(`/cart/items/${encodeURIComponent(id)}`)
  return data
}

export async function applyCoupon(code: string) {
  const { data } = await api.put<CartResponse>('/cart/coupon', { code })
  return data
}

export async function removeCoupon() {
  const { data } = await api.delete<CartResponse>('/cart/coupon')
  return data
}

export async function mergeCart(guestId: string) {
  const { data } = await api.post<MergeCartResponse>('/cart/merge', { guestId })
  return data
}