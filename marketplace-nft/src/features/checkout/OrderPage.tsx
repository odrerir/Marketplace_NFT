import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { clearAttempt } from '@/lib/checkout-attempt'
import { NETWORK_LABELS } from '@/features/home/labels'
import type { Order } from '@/types/api'
import { formatDate, shortHash } from './format'
import { useOrder } from './hooks'

const route = getRouteApi('/_authed/pedido/$id')
const PROVIDER_LABELS = { metamask: 'MetaMask', walletconnect: 'WalletConnect', coinbase: 'Coinbase Wallet' } as const
const card = 'mx-auto w-full max-w-[578px] rounded-[4px] border-b-[10px] border-primary bg-card'

function Receipt({ order }: { order: Order }) {
  return (
    <section aria-labelledby="titulo-recibo" className={card}>
      <header className="border-b border-primary px-6 py-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 size-12 text-primary" aria-hidden="true" />
        <h1 id="titulo-recibo" className="font-bold text-accent-text">Seus NFTs agora estão na sua carteira</h1>
      </header>
      <dl className="grid grid-cols-2 gap-4 border-b border-primary px-6 py-4 text-sm md:grid-cols-4">
        <div><dt className="font-bold">ID da transação</dt><dd className="text-muted-foreground">{shortHash(order.transactionId ?? '')}</dd></div>
        <div><dt className="font-bold">Data</dt><dd className="text-muted-foreground">{formatDate(order.updatedAt)}</dd></div>
        <div><dt className="font-bold">Total</dt><dd className="text-muted-foreground">{order.total} ETH</dd></div>
        <div><dt className="font-bold">Carteira</dt><dd className="text-muted-foreground">{PROVIDER_LABELS[order.walletProvider]}</dd></div>
      </dl>
      <div className="px-6 py-6">
        <h2 className="mb-3 font-bold">Detalhes da transação</h2>
        <table className="w-full text-sm">
          <caption className="sr-only">Itens do pedido</caption>
          <thead>
            <tr className="border-b border-border text-left"><th className="py-2">NFTs</th><th>Edições</th><th className="text-right">Subtotal</th></tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={`${it.nftId}-${it.editionLabel}`}>
                <td className="flex items-center gap-3 py-2">
                  <img src={it.image} alt="" width={56} height={56} className="size-14 rounded-[8px] object-cover" />
                  <span><span className="block font-bold">{it.name}</span><span className="text-xs text-muted-foreground">ID do token: #{it.tokenId}</span></span>
                </td>
                <td>(x {it.quantity})</td>
                <td className="text-right font-bold text-primary">{it.lineTotal} ETH</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="mt-3 space-y-1 border-b border-border pb-3 text-sm">
          {order.couponCode && <div className="flex justify-between"><dt>Desconto ({order.couponCode})</dt><dd>(-) {order.discount} ETH</dd></div>}
          <div className="flex justify-between"><dt>Taxa de rede</dt><dd>{order.networkFee} ETH</dd></div>
          <div className="flex justify-between font-bold"><dt>Total</dt><dd className="text-primary">{order.total} ETH</dd></div>
        </dl>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Transação confirmada na {NETWORK_LABELS[order.network]}. A propriedade foi transferida para a carteira {order.walletNickname} e registrada na rede.
        </p>
        <div className="mt-4 text-center">
          <button type="button" disabled className="rounded-[4px] bg-primary px-6 py-3 text-sm font-bold text-primary-foreground opacity-60">Ver no Etherscan</button>
          <p className="mt-2 text-xs text-muted-foreground">Link de exploração simulado nesta demonstração.</p>
        </div>
        <div className="mt-6 text-center">
          <Link to="/" className="text-sm font-bold text-primary underline">Continuar explorando</Link>
        </div>
      </div>
    </section>
  )
}

export function OrderPage() {
  const { id } = route.useParams()
  const queryClient = useQueryClient()
  const { data: order, isPending, isError, error, refetch } = useOrder(id)
  const status = order?.status

  // Pedido terminal: a tentativa acabou (a próxima compra terá outra chave) e o carrinho pode ter mudado.
  useEffect(() => {
    if (status && status !== 'pending') clearAttempt()
    if (status === 'confirmed') void queryClient.invalidateQueries({ queryKey: ['cart'] })
  }, [status, queryClient])

  const notFound = isError && isAxiosError(error) && error.response?.status === 404

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      {isPending ? (
        <div className={card} aria-hidden="true"><div className="skeleton m-6 h-72 rounded" /></div>
      ) : isError ? (
        <div role="alert" className={`${card} p-8 text-center`}>
          <h1 className="mb-2 text-xl font-bold">{notFound ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido'}</h1>
          <p className="mb-6 text-muted-foreground">{notFound ? 'Ele não existe ou não pertence à sua conta.' : 'Verifique sua conexão e tente de novo.'}</p>
          {notFound
            ? <Link to="/" className="rounded-[8px] bg-primary px-4 py-2 font-bold text-primary-foreground">Voltar ao início</Link>
            : <button type="button" onClick={() => refetch()} className="rounded-[8px] bg-primary px-4 py-2 font-bold text-primary-foreground">Tentar novamente</button>}
        </div>
      ) : order.status === 'pending' ? (
        <div role="status" className={`${card} p-8 text-center`}>
          <Loader2 className="mx-auto mb-4 size-10 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
          <h1 className="mb-2 text-xl font-bold">Processando seu pagamento</h1>
          <p className="text-sm text-muted-foreground">Aguardando a confirmação da rede. Você pode recarregar esta página: seu pedido não será duplicado.</p>
          <p className="mt-4 text-xs text-muted-foreground">Total: {order.total} ETH</p>
        </div>
      ) : order.status === 'refused' ? (
        <div role="alert" className={`${card} p-8 text-center`}>
          <h1 className="mb-2 text-xl font-bold">Pagamento recusado</h1>
          <p className="mb-2 text-sm">{order.refusalReason}</p>
          <p className="mb-6 text-sm text-muted-foreground">Seus itens continuam no carrinho.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/pagamento" className="rounded-[8px] bg-primary px-4 py-2 font-bold text-primary-foreground">Tentar novamente</Link>
            <Link to="/carrinho" className="rounded-[8px] border border-primary px-4 py-2 font-bold text-primary">Voltar ao carrinho</Link>
          </div>
        </div>
      ) : (
        <Receipt order={order} />
      )}
    </main>
  )
}