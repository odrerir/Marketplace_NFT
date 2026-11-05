import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { db } from './db'
import { clearFailures, setFailure } from './scenarios'
import type { FailureMode } from './scenarios'

export const worker = setupWorker(...handlers)

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
    /** Ex.: __kurioMock.setFailure('favorites', 'http500') | 'network' | 'none' */
    setFailure: (key: string, mode: FailureMode) => setFailure(key, mode),
    clearFailures,
  },
})