import { createFileRoute } from '@tanstack/react-router'
import { NftDetailPage } from '@/features/detail/NftDetailPage'

export const Route = createFileRoute('/nft/$id')({ component: NftDetailPage })