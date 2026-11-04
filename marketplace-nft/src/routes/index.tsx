import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/features/home/HomePage'
import { parseHomeSearch } from '@/features/home/search'

export const Route = createFileRoute('/')({
  validateSearch: parseHomeSearch,
  component: HomePage,
})