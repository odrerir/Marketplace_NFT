import { nftFixtures } from './fixtures/nfts'
import { userFixtures } from './fixtures/users'
import type { Nft } from '@/types/api'

const STORAGE_KEY = 'kurio-mock-db:v4'

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

export interface StoredFavorite {
  userId: string
  nftId: string
}

/** ownerId: "user:<id>" para logados, "guest:<id>" para visitantes. */
export interface StoredCartItem {
  id: string
  ownerId: string
  nftId: string
  editionId: string
  quantity: number
}

export interface StoredCartCoupon {
  ownerId: string
  code: string
}

interface DbState {
  nfts: Nft[]
  users: StoredUser[]
  sessions: StoredSession[]
  favorites: StoredFavorite[]
  cartItems: StoredCartItem[]
  cartCoupons: StoredCartCoupon[]
}

function seed(): DbState {
  return {
    nfts: structuredClone(nftFixtures),
    users: structuredClone(userFixtures),
    sessions: [],
    favorites: [],
    cartItems: [],
    cartCoupons: [],
  }
}

function load(): DbState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Partial<DbState>
    const ok = [p.nfts, p.users, p.sessions, p.favorites, p.cartItems, p.cartCoupons].every(Array.isArray)
    return ok ? (p as DbState) : null
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
  get favorites() {
    return state.favorites
  },
  get cartItems() {
    return state.cartItems
  },
  get cartCoupons() {
    return state.cartCoupons
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