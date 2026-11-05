import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { sessionQueryOptions } from '@/api/auth'

export interface AuthSearch {
  redirect?: string
}

export const parseAuthSearch = (s: Record<string, unknown>): AuthSearch => ({
  redirect: typeof s.redirect === 'string' ? s.redirect : undefined,
})

/** Quem já está logado não precisa ver login nem cadastro. */
export async function guestOnly({ context }: { context: { queryClient: QueryClient } }) {
  const user = await context.queryClient.ensureQueryData(sessionQueryOptions())
  if (user) throw redirect({ to: '/' })
}