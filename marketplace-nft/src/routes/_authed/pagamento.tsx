import { createFileRoute } from '@tanstack/react-router'
import { PaymentPage } from '@/features/checkout/PaymentPage'

export const Route = createFileRoute('/_authed/pagamento')({ component: PaymentPage })