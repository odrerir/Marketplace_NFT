import type { StoredWallet } from '../db'

export const walletFixtures: StoredWallet[] = [
  { id: 'wallet-ana-principal', userId: 'user-ana', kind: 'primary', nickname: 'Principal', network: 'ethereum', address: '0xA91F4c2B7d93E1a05c68b4F2d7aE3c91B0f5E82C' },
  { id: 'wallet-ana-reserva', userId: 'user-ana', kind: 'secondary', nickname: 'Reserva', network: 'polygon', address: '0x5b3D9e07C4a1F86d2E7b0A93c15F8d46e2B7a10c' },
]