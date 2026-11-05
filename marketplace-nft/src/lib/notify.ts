import { useSyncExternalStore } from 'react'

export type NoticeKind = 'info' | 'success' | 'error'
export interface Notice {
  id: number
  kind: NoticeKind
  message: string
}

let notices: Notice[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function dismiss(id: number) {
  notices = notices.filter((n) => n.id !== id)
  emit()
}

export function notify(message: string, kind: NoticeKind = 'info', ttl = 6000) {
  const id = nextId++
  notices = [...notices, { id, kind, message }]
  emit()
  setTimeout(() => dismiss(id), ttl)
}

export function useNotices(): Notice[] {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    () => notices,
  )
}