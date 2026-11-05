import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { db } from './db'

export const worker = setupWorker(...handlers)

// Atalhos para desenvolvimento e testes
Object.assign(window, {
  __kurioMock: {
    resetDb: () => db.reset(),
    /** Faz todas as sessões expirarem: o próximo pedido autenticado recebe 401. */
    expireSessions: () =>
      db.update((s) => {
        s.sessions.forEach((x) => {
          x.expiresAt = new Date(0).toISOString()
        })
      }),
  },
})