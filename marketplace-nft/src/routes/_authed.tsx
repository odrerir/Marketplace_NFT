import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { sessionQueryOptions } from '@/api/auth'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(sessionQueryOptions())
    if (!user) throw redirect({ to: '/login', search: { redirect: location.href } })
  },
  component: Outlet,
})