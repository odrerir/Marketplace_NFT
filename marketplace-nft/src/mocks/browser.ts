import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { db } from './db'

export const worker = setupWorker(...handlers)

Object.assign(window, { __kurioMock: { resetDb: () => db.reset() } })