import { api } from '@/lib/api'
import type { Wallet, WalletConnection, WalletInput, WalletProvider } from '@/types/api'

export async function getWallets(signal?: AbortSignal) {
  const { data } = await api.get<{ items: Wallet[] }>('/wallets', { signal })
  return data.items
}

export async function createWallet(body: WalletInput) {
  const { data } = await api.post<Wallet>('/wallets', body)
  return data
}

export async function updateWallet({ id, ...body }: Omit<WalletInput, 'kind'> & { id: string }) {
  const { data } = await api.patch<Wallet>(`/wallets/${encodeURIComponent(id)}`, body)
  return data
}

export async function connectWallet(body: { walletId: string; provider: WalletProvider }) {
  const { data } = await api.post<WalletConnection>('/wallet-connections', body)
  return data
}

export async function disconnectWallet(connectionId: string) {
  await api.delete(`/wallet-connections/${encodeURIComponent(connectionId)}`)
}