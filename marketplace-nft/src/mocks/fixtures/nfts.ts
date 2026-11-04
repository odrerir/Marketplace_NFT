import type { Nft } from '@/types/api'

export const nfts: Nft[] = [
  { id: 'nft-042', name: 'Emerald Ape #042', tokenId: '0042', collection: 'Kurio Apes', network: 'ethereum', price: '1.19', isRare: true, version: 1 },
  { id: 'nft-009', name: 'Sage Nomad #009', tokenId: '0009', collection: 'Kurio Nomads', network: 'ethereum', price: '1.69', isRare: false, version: 1 },
  { id: 'nft-552', name: 'Neon Vessel #552', tokenId: '0552', collection: 'Kurio Vessels', network: 'polygon', price: '1.99', previousPrice: '2.29', isRare: true, version: 1 },
]