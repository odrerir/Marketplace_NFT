import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { BottomNav } from '@/features/home/BottomNav'
import { TopNav } from '@/features/home/TopNav'
import { apiErrorOf, errorMessage } from '@/lib/errors'
import type { CartLine, CartResponse } from '@/types/api'
import { useCart, useCartMutations } from './useCart'

const step =
  'flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40'

function Line({ line }: { line: CartLine }) {
  const { update, remove } = useCartMutations()
  const busy =
    (update.isPending && update.variables?.id === line.id) || (remove.isPending && remove.variables === line.id)

  return (
    <li className="grid grid-cols-[72px_1fr_auto] items-center gap-x-3 gap-y-1 rounded-[12px] bg-card p-2 md:grid-cols-[72px_1fr_110px_150px_110px_40px]">
      <img src={line.image} alt={line.name} width={72} height={72} className="size-[72px] rounded-[8px] object-cover" />
      <div className="min-w-0">
        <h2 className="truncate font-bold">{line.name}</h2>
        <p className="text-xs text-muted-foreground">
          Edição: {line.editionLabel} · ID do token: #{line.tokenId}
        </p>
        <p className="text-sm font-bold text-primary md:hidden">{line.lineTotal} ETH</p>
        {line.unavailable && (
          <p role="alert" className="text-xs text-coral">
            {line.available === 0 ? 'Edição esgotada.' : `Só há ${line.available} disponíveis.`} Ajuste a quantidade ou remova o item.
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 md:contents">
        <p className="hidden font-bold text-primary md:block">{line.unitPrice} ETH</p>
        <div role="group" aria-label={`Quantidade de ${line.name}`} className="flex items-center gap-2">
          <button type="button" aria-label="Diminuir quantidade" disabled={busy || line.quantity <= 1} onClick={() => update.mutate({ id: line.id, quantity: line.quantity - 1 })} className={step}>
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <output aria-live="polite" className="w-6 text-center">{line.quantity}</output>
          <button type="button" aria-label="Aumentar quantidade" disabled={busy || line.quantity >= line.available} onClick={() => update.mutate({ id: line.id, quantity: line.quantity + 1 })} className={step}>
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
        <p className="hidden font-bold text-primary md:block">{line.lineTotal} ETH</p>
        <button type="button" aria-label={`Remover ${line.name}`} disabled={busy} onClick={() => remove.mutate(line.id)} className="flex size-8 items-center justify-center text-primary disabled:opacity-40">
          <Trash2 className="size-5" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

function CouponBox({ cart }: { cart: CartResponse }) {
  const { coupon, clearCoupon } = useCartMutations()
  const [code, setCode] = useState('')
  const error = coupon.isError ? (apiErrorOf(coupon.error)?.fieldErrors?.code ?? errorMessage(coupon.error)) : undefined

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    coupon.mutate(code, { onSuccess: () => setCode('') })
  }

  if (cart.coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[8px] border border-primary px-3 py-2 text-sm">
        <p>
          Cupom <strong>{cart.coupon.code}</strong> aplicado ({cart.coupon.description})
        </p>
        <button type="button" disabled={clearCoupon.isPending} onClick={() => clearCoupon.mutate()} className="font-bold text-primary underline">
          Remover
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor="cupom" className="mb-1 block text-sm font-bold">Código promocional</label>
      <div className="flex">
        <input
          id="cupom"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Digite o código promocional..."
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'cupom-erro' : undefined}
          className="h-10 min-w-0 flex-1 rounded-l-[8px] border border-primary bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
        />
        <button type="submit" disabled={coupon.isPending} className="rounded-r-[8px] bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60">
          {coupon.isPending ? '...' : 'Aplicar'}
        </button>
      </div>
      {error && <p id="cupom-erro" role="alert" className="mt-1 text-xs text-coral">{error}</p>}
    </form>
  )
}

function Summary({ cart }: { cart: CartResponse }) {
  return (
    <aside aria-label="Resumo do pedido" className="mt-6 space-y-4 lg:mt-0">
      <h2 className="border-b border-border pb-2 text-lg font-bold">Resumo da carteira</h2>
      <CouponBox cart={cart} />
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{cart.subtotal} ETH</dd></div>
        <div className="flex justify-between"><dt>Desconto do lançamento</dt><dd>(-) {cart.discount}</dd></div>
        <div className="flex justify-between"><dt>Taxa de rede</dt><dd>{cart.networkFee} ETH</dd></div>
        <p className="text-right text-xs text-primary">Taxa estimada</p>
        <div className="flex justify-between border-t border-border pt-3 text-base font-bold"><dt>Total</dt><dd className="text-primary">{cart.total} ETH</dd></div>
      </dl>
      {cart.hasIssues ? (
        <>
          <button type="button" disabled className="h-12 w-full rounded-[8px] bg-primary font-bold text-primary-foreground opacity-60">
            Conectar e finalizar
          </button>
          <p role="alert" className="text-xs text-coral">Resolva os itens indisponíveis para continuar.</p>
        </>
      ) : (
        <Link to="/pagamento" className="flex h-12 w-full items-center justify-center rounded-[8px] bg-primary font-bold text-primary-foreground">
          Conectar e finalizar
        </Link>
      )}
      <Link to="/" className="block text-center text-sm text-primary">Continuar explorando</Link>
    </aside>
  )
}

function CartSkeleton() {
  return (
    <div aria-hidden="true" className="lg:grid lg:grid-cols-[1fr_332px] lg:gap-[86px]">
      <div className="space-y-3">
        {[0, 1, 2].map((i) => <div key={i} className="skeleton h-[88px] rounded-[12px]" />)}
      </div>
      <div className="mt-6 space-y-3 lg:mt-0">
        <div className="skeleton h-7 w-2/3 rounded" />
        <div className="skeleton h-10 rounded" />
        <div className="skeleton h-28 rounded" />
        <div className="skeleton h-12 rounded" />
      </div>
    </div>
  )
}

export function CartPage() {
  const { data: cart, isPending, isError, refetch } = useCart()

  return (
    <>
      <TopNav />
      <main className="mx-auto w-full max-w-[1248px] px-6 pb-[calc(94.95px+2rem)] pt-6 lg:pb-16">
        <p className="mb-4 hidden text-sm font-bold lg:block"><Link to="/">Início</Link> / Mercado / Carrinho</p>
        <h1 className="mb-6 text-center text-xl font-bold lg:sr-only">Carrinho de NFTs</h1>

        {isPending ? (
          <>
            <p role="status" className="sr-only">Carregando carrinho</p>
            <CartSkeleton />
          </>
        ) : isError ? (
          <div role="alert" className="py-16 text-center">
            <p className="mb-4">Não foi possível carregar o carrinho.</p>
            <button type="button" onClick={() => refetch()} className="rounded-[10px] bg-primary px-4 py-2 font-bold text-primary-foreground">Tentar novamente</button>
          </div>
        ) : cart.items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-4">Seu carrinho está vazio.</p>
            <Link to="/" className="rounded-[10px] bg-primary px-4 py-2 font-bold text-primary-foreground">Explorar NFTs</Link>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[1fr_332px] lg:gap-[86px]">
            <ul className="space-y-3">
              {cart.items.map((line) => <Line key={line.id} line={line} />)}
            </ul>
            <Summary cart={cart} />
          </div>
        )}
      </main>
      <Footer />
      <div className="lg:hidden"><BottomNav /></div>
    </>
  )
}