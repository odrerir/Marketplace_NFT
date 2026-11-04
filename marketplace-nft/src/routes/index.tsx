import { createFileRoute } from '@tanstack/react-router'
import { HomeMobile } from '@/features/home/HomeMobile'
import { parseHomeSearch } from '@/features/home/search'

export const Route = createFileRoute('/')({
  validateSearch: parseHomeSearch,
  component: HomeMobile,
})