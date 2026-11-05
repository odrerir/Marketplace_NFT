import { nftFixtures } from './fixtures/nfts'
import { userFixtures } from './fixtures/users'
import type { Nft } from '@/types/api'

const STORAGE_KEY = 'kurio-mock-db:v2'

export interface StoredUser {
  id: string
  username: string
  displayName: string
  email: string
  salt: string
  passwordHash: string
}

export interface StoredSession {
  token: string
  userId: string
  expiresAt: string
}

interface DbState {
  nfts: Nft[]
  users: StoredUser[]
  sessions: StoredSession[]
}

function seed(): DbState {
  return {
    nfts: structuredClone(nftFixtures),
    users: structuredClone(userFixtures),
    sessions: [],
  }
}

function load(): DbState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DbState>
    return Array.isArray(parsed.nfts) && Array.isArray(parsed.users) && Array.isArray(parsed.sessions)
      ? (parsed as DbState)
      : null
  } catch {
    return null
  }
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage indisponível: o mock continua funcionando só em memória
  }
}

let state: DbState = load() ?? seed()

export const db = {
  get nfts() {
    return state.nfts
  },
  get users() {
    return state.users
  },
  get sessions() {
    return state.sessions
  },
  /** Todas as escritas passam por aqui, para sempre persistirem. */
  update(mutator: (s: DbState) => void) {
    mutator(state)
    persist()
  },
  /** Restaura integralmente o cenário conhecido. */
  reset() {
    state = seed()
    persist()
  },
}