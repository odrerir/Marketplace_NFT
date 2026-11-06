import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { findOrderByKey, createOrder } from '@/api/orders'
import { connectWallet, createWallet, disconnectWallet } from '@/api/wallets'
import { Field } from '@/components/Field'
import { Footer } from '@/components/Footer'
import { useCart } from '@/features/cart/useCart'
import { NETWORK_LABELS } from '@/features/home/labels'
import { TopNav } from '@/features/home/TopNav'
import { useSession } from '@/lib/auth'
import { getAttemptKey, peekAttempt } from '@/lib/checkout-attempt'
import { apiErrorOf, errorMessage } from '@/lib/errors'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'
import { validators } from '@/lib/validators'
import type { FieldErrors } from '@/lib/validators'
import type { CartResponse, CreateOrderRequest, NftNetwork, Wallet, WalletConnection, WalletKind, WalletProvider } from '@/types/api'
import { useWallets } from './hooks'
import { shortHash } from './format'

const PROVIDERS: { id: WalletProvider; label: string }[] = [
  { id: 'walletconnect', label: 'WalletConnect' },
  { id: 'metamask', label: 'MetaMask' },
  { id: 'coinbase', label: 'Coinbase Wallet' },
]

type Key = 'displayName' | 'email' | 'note' | 'wallet' | 'provider'
type Step = 'idle' | 'connecting' | 'sending'

const radioRow = 'flex cursor-pointer items-center gap-3 rounded-[10px] border p-3 text-sm'

function AddWalletForm({ kind, onCreated }: { kind: WalletKind; onCreated: (wallet: Wallet) => void }) {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const [nickname, setNickname] = useState('')
  const [network, setNetwork] = useState<NftNetwork>('ethereum')
  const [address, setAddress] = useState('')
  const [errors, setErrors] = useState<FieldErrors<'nickname' | 'address'>>({})

  const mutation = useMutation({
    mutationFn: createWallet,
    onSuccess: (wallet) => {
      void queryClient.invalidateQueries({ queryKey: ['wallets', user?.id] })
      notify('Carteira cadastrada.', 'success', 3000)
      onCreated(wallet)
    },
    onError: (error) => {
      const fields = apiErrorOf(error)?.fieldErrors
      if (fields) setErrors(fields as FieldErrors<'nickname' | 'address'>)
      else notify(errorMessage(error), 'error')
    },
  })

  function save() {
    const next = {
      nickname: validators.nickname(nickname),
      address: validators.walletAddress(address.trim(), network),
    }
    setErrors(next)
    if (next.nickname || next.address) return
    mutation.mutate({ kind, nickname: nickname.trim(), network, address: address.trim() })
  }

  return (
    // Não é um <form>: estamos dentro do formulário do pedido. Enter salva a carteira, não o pedido.
    <div
      role="group"
      aria-label="Cadastrar carteira"
      className="space-y-3 rounded-[10px] border border-border-soft p-4"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          save()
        }
      }}
    >
      <Field label="Apelido da carteira" required value={nickname} onChange={(e) => setNickname(e.target.value)} error={errors.nickname} />
      <div>
        <label htmlFor="rede-carteira" className="mb-1 block text-sm">Rede<span aria-hidden="true" className="text-coral"> *</span></label>
        <select
          id="rede-carteira"
          value={network}
          onChange={(e) => setNetwork(e.target.value as NftNetwork)}
          className="h-[50px] w-full rounded-[10px] border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
        >
          {(Object.entries(NETWORK_LABELS) as [NftNetwork, string][]).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </div>
      <Field label="Endereço da carteira" required placeholder={network === 'solana' ? 'Endereço Solana' : 'Endereço 0x da carteira'} value={address} onChange={(e) => setAddress(e.target.value)} error={errors.address} />
      <button type="button" onClick={save} disabled={mutation.isPending} className="rounded-[8px] bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60">
        {mutation.isPending ? 'Salvando...' : 'Salvar carteira'}
      </button>
    </div>
  )
}

function Summary({ cart, notice, step, formError, onConfirmDisabled }: {
  cart: CartResponse
  notice?: string
  step: Step
  formError?: string
  onConfirmDisabled: boolean
}) {
  const label = step === 'connecting' ? 'Conectando à carteira...' : step === 'sending' ? 'Enviando pedido...' : notice ? 'Confirmar com os novos valores' : 'Confirmar compra'
  return (
    <aside aria-label="Resumo do pedido" className="mt-8 space-y-4 lg:mt-0">
      <h2 className="text-lg font-bold">Seus NFTs</h2>
      <ul className="space-y-2">
        {cart.items.map((l) => (
          <li key={l.id} className="flex items-center gap-3 rounded-[10px] bg-card p-2 text-sm">
            <img src={l.image} alt="" width={48} height={48} className="size-12 rounded-[8px] object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{l.name}</p>
              <p className="text-xs text-muted-foreground">Edição {l.editionLabel} · x{l.quantity}</p>
            </div>
            <p className="font-bold text-primary">{l.lineTotal} ETH</p>
          </li>
        ))}
      </ul>
      {cart.coupon && <p className="text-xs text-muted-foreground">Cupom {cart.coupon.code} aplicado.</p>}
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{cart.subtotal} ETH</dd></div>
        <div className="flex justify-between"><dt>Desconto do lançamento</dt><dd>(-) {cart.discount}</dd></div>
        <div className="flex justify-between"><dt>Taxa de rede</dt><dd>{cart.networkFee} ETH</dd></div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-bold"><dt>Total</dt><dd className="text-primary">{cart.total} ETH</dd></div>
      </dl>
      {notice && <p role="alert" className="rounded-[8px] border border-coral p-3 text-sm text-coral">{notice}</p>}
      {cart.hasIssues && (
        <p role="alert" className="rounded-[8px] border border-coral p-3 text-sm text-coral">
          Há itens indisponíveis. <Link to="/carrinho" className="underline">Ajuste o carrinho</Link> para continuar.
        </p>
      )}
      {formError && <p role="alert" className="text-sm text-coral">{formError}</p>}
      <button type="submit" disabled={onConfirmDisabled || step !== 'idle'} className="h-12 w-full rounded-[8px] bg-primary font-bold text-primary-foreground disabled:opacity-60">
        {label}
      </button>
    </aside>
  )
}

export function PaymentPage() {
  const { user } = useSession()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: cart, isPending: cartPending, isError: cartError, refetch } = useCart()
  const { data: wallets = [], isPending: walletsPending } = useWallets()

  const [collector, setCollector] = useState({ displayName: user?.displayName ?? '', email: user?.email ?? '', note: '' })
  const [pickedWallet, setPickedWallet] = useState('')
  const [provider, setProvider] = useState<WalletProvider | ''>('')
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const [errors, setErrors] = useState<FieldErrors<Key>>({})
  const [notice, setNotice] = useState<string>()
  const [formError, setFormError] = useState<string>()
  const [step, setStep] = useState<Step>('idle')

  const walletId = pickedWallet || wallets[0]?.id || ''
  const canAddWallet = wallets.length < 2
  const nextKind: WalletKind = wallets.some((w) => w.kind === 'primary') ? 'secondary' : 'primary'

  // Recuperação: se uma tentativa anterior chegou a criar o pedido (a resposta pode ter se perdido
  // por timeout ou refresh), vamos direto para ele em vez de pedir a compra de novo.
  useEffect(() => {
    const attempt = peekAttempt()
    if (!attempt) return
    let cancelled = false
    findOrderByKey(attempt.key)
      .then((order) => {
        if (order && !cancelled) void navigate({ to: '/pedido/$id', params: { id: order.id }, replace: true })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [navigate])

  const place = useMutation({
    mutationFn: async () => {
      if (!cart || !provider) throw new Error('Dados incompletos.')
      let conn = connection
      if (!conn || conn.walletId !== walletId || conn.provider !== provider) {
        setStep('connecting')
        conn = await connectWallet({ walletId, provider })
        setConnection(conn)
      }
      setStep('sending')
      const body: CreateOrderRequest = {
        quoteId: cart.quoteId,
        walletId,
        connectionId: conn.id,
        collector: {
          displayName: collector.displayName.trim(),
          email: collector.email.trim(),
          note: collector.note.trim() || undefined,
        },
      }
      // A chave só muda quando o conteúdo muda: cliques repetidos e reenvios usam a mesma.
      const fingerprint = JSON.stringify([body.quoteId, body.walletId, body.collector])
      return createOrder(body, getAttemptKey(fingerprint))
    },
    onSuccess: (order) => {
      setNotice(undefined)
      void navigate({ to: '/pedido/$id', params: { id: order.id } })
    },
    onError: (error) => {
      const api = apiErrorOf(error)
      if (api?.code === 'QUOTE_CHANGED' && api.cart) {
        queryClient.setQueryData(['cart', user?.id ?? 'guest'], api.cart)
        setNotice(api.message)
        setFormError(undefined)
      } else if (api?.code === 'FORBIDDEN') {
        setConnection(null)
        setFormError(api.message)
      } else if (api?.fieldErrors) {
        setErrors(api.fieldErrors as FieldErrors<Key>)
        setFormError(undefined)
      } else if (api) {
        if (api.code === 'CONFLICT') setConnection(null)
        setFormError(api.message)
      } else {
        // sem resposta: o pedido pode ter sido criado. Confirmar de novo recupera o mesmo, sem duplicar.
        setFormError('Não recebemos a resposta do servidor. Seu pedido pode ter sido criado: confirme novamente e recuperaremos o mesmo pedido, sem duplicar a compra.')
      }
    },
    onSettled: () => setStep('idle'),
  })

  const disconnect = useMutation({
    mutationFn: (id: string) => disconnectWallet(id),
    onSuccess: () => {
      setConnection(null)
      notify('Carteira desconectada.', 'info', 3000)
    },
    onError: (error) => notify(errorMessage(error), 'error'),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    const next: FieldErrors<Key> = {
      displayName: validators.displayName(collector.displayName),
      email: validators.email(collector.email.trim()),
      note: validators.note(collector.note),
      wallet: walletId ? undefined : 'Cadastre ou selecione uma carteira.',
      provider: provider ? undefined : 'Escolha como conectar sua carteira.',
    }
    setErrors(next)
    setFormError(undefined)
    if (Object.values(next).some(Boolean)) return
    place.mutate()
  }

  return (
    <>
      <TopNav />
      <main className="mx-auto w-full max-w-[1248px] px-6 pb-16 pt-6">
        <Link to="/carrinho" className="mb-4 inline-flex items-center gap-2 text-sm text-primary">
          <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao carrinho
        </Link>
        <h1 className="mb-6 text-xl font-bold">Pagamento com carteira</h1>

        {cartPending || walletsPending ? (
          <div aria-hidden="true" className="space-y-3">
            <p role="status" className="sr-only">Carregando pagamento</p>
            {[0, 1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-[12px]" />)}
          </div>
        ) : cartError ? (
          <div role="alert" className="py-12 text-center">
            <p className="mb-4">Não foi possível carregar seu carrinho.</p>
            <button type="button" onClick={() => refetch()} className="rounded-[10px] bg-primary px-4 py-2 font-bold text-primary-foreground">Tentar novamente</button>
          </div>
        ) : cart.items.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-4">Não há itens para pagar.</p>
            <Link to="/" className="rounded-[10px] bg-primary px-4 py-2 font-bold text-primary-foreground">Explorar NFTs</Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-12">
            <div className="space-y-8">
              <section aria-labelledby="colecionador" className="space-y-4">
                <h2 id="colecionador" className="text-lg font-bold">Perfil do colecionador</h2>
                <Field label="Nome de exibição" required value={collector.displayName} onChange={(e) => setCollector({ ...collector, displayName: e.target.value })} error={errors.displayName} />
                <Field label="E-mail" type="email" required value={collector.email} onChange={(e) => setCollector({ ...collector, email: e.target.value })} error={errors.email} />
                <div>
                  <label htmlFor="observacao" className="mb-1 block text-sm">Observação do colecionador (opcional)</label>
                  <textarea
                    id="observacao"
                    rows={3}
                    value={collector.note}
                    onChange={(e) => setCollector({ ...collector, note: e.target.value })}
                    aria-invalid={errors.note ? true : undefined}
                    className="w-full rounded-[10px] border border-input bg-background p-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
                  />
                  {errors.note && <p className="mt-1 text-xs text-coral">{errors.note}</p>}
                </div>
              </section>

              <fieldset className="space-y-3">
                <legend className="mb-2 text-lg font-bold">Carteira conectada</legend>
                {wallets.length === 0 && <p className="text-sm text-muted-foreground">Você ainda não tem carteiras. Cadastre uma para continuar.</p>}
                {wallets.map((w) => (
                  <label key={w.id} className={cn(radioRow, walletId === w.id ? 'border-primary' : 'border-border-soft')}>
                    <input type="radio" name="carteira" className="accent-primary" checked={walletId === w.id} onChange={() => setPickedWallet(w.id)} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold">{w.nickname}</span>
                      <span className="block text-xs text-muted-foreground">{shortHash(w.address)} · Rede {NETWORK_LABELS[w.network]}</span>
                    </span>
                  </label>
                ))}
                {errors.wallet && <p className="text-xs text-coral">{errors.wallet}</p>}
                {canAddWallet && <AddWalletForm kind={nextKind} onCreated={(w) => setPickedWallet(w.id)} />}
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="mb-2 text-lg font-bold">Carteira e rede</legend>
                {PROVIDERS.map((p) => (
                  <label key={p.id} className={cn(radioRow, provider === p.id ? 'border-primary' : 'border-border-soft')}>
                    <input type="radio" name="provedor" className="accent-primary" checked={provider === p.id} onChange={() => setProvider(p.id)} />
                    {p.label}
                  </label>
                ))}
                {errors.provider && <p className="text-xs text-coral">{errors.provider}</p>}
                {connection && (
                  <p role="status" className="flex items-center justify-between gap-3 text-sm text-success">
                    Conectada com {PROVIDERS.find((p) => p.id === connection.provider)?.label}
                    <button type="button" disabled={disconnect.isPending} onClick={() => disconnect.mutate(connection.id)} className="text-primary underline">
                      Desconectar
                    </button>
                  </p>
                )}
              </fieldset>
            </div>

            <Summary cart={cart} notice={notice} step={step} formError={formError} onConfirmDisabled={cart.hasIssues} />
          </form>
        )}
      </main>
      <Footer />
    </>
  )
}