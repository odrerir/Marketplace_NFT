import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/features/checkout/OrderPage'

export const Route = createFileRoute('/_authed/pedido/$id')({ component: OrderPage })