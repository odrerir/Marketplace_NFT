import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { db } from './db'
import { clearFailures, setFailure, setOption } from './scenarios'
import type { FailureMode } from './scenarios'
import { emitNftUpdated } from './realtime'

export const worker = setupWorker(...handlers)

interface NftPatch {
  price?: string
  editionId?: string
  available?: number
}

// Atalhos para desenvolvimento e testes
Object.assign(window, {
  __kurioMock: {
    resetDb: () => {
      db.reset()
      clearFailures()
    },
    /** Faz todas as sessões expirarem: o próximo pedido autenticado recebe 401. */
    expireSessions: () =>
      db.update((s) => {
        s.sessions.forEach((x) => {
          x.expiresAt = new Date(0).toISOString()
        })
      }),
    /** Ex.: setFailure('favorites' | 'cart' | 'wallets' | 'orders', 'http500' | 'network' | 'none') */
    setFailure: (key: string, mode: FailureMode) => setFailure(key, mode),
    /** Ex.: setOption('payment', 'refuse' | 'timeout' | 'confirm'); setOption('wallet', 'refuse' | 'ok') */
    setOption: (key: string, value: string) => setOption(key, value),
    clearFailures,
    /** Muda preço ou disponibilidade de um NFT, como uma atualização do catálogo. */
    changeNft: (id: string, patch: NftPatch) =>
      db.update((s) => {
        const nft = s.nfts.find((n) => n.id === id)
        if (!nft) return
        if (patch.price) nft.price = patch.price
        if (patch.editionId !== undefined && patch.available !== undefined) {
          const edition = nft.editions.find((e) => e.id === patch.editionId)
          if (edition) edition.available = patch.available
        }
        nft.version += 1
        emitNftUpdated(nft)
      }),
    /** Simula a carteira desconectando por conta própria. */
    disconnectWallet: () =>
      db.update((s) => {
        s.connections.forEach((c) => {
          c.active = false
        })
      }),
  },
})