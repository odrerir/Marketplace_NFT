import { nftFixtures } from './fixtures/nfts'
import type { Nft } from '@/types/api'

const STORAGE_KEY = 'kurio-mock-db:v1'

interface DbState {
  nfts: Nft[]
}

function seed(): DbState {
  return { nfts: structuredClone(nftFixtures) }
}

function load(): DbState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DbState
    return Array.isArray(parsed.nfts) ? parsed : null
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