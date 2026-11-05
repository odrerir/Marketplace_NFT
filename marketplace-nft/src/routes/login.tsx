import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { login } from '@/api/auth'
import { Field } from '@/components/Field'
import { guestOnly, parseAuthSearch } from '@/features/auth/guards'
import { AuthShell } from '@/features/auth/AuthShell'
import { safeRedirect, startSession } from '@/lib/auth'
import { apiErrorOf, errorMessage } from '@/lib/errors'
import { validators } from '@/lib/validators'
import type { FieldErrors } from '@/lib/validators'

export const Route = createFileRoute('/login')({
  validateSearch: parseAuthSearch,
  beforeLoad: guestOnly,
  component: LoginPage,
})

type Key = 'email' | 'password'

function LoginPage() {
  const { redirect } = Route.useSearch()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors<Key>>({})
  const [formError, setFormError] = useState<string>()

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      startSession(data)
      router.history.push(safeRedirect(redirect))
    },
    onError: (error) => {
      const api = apiErrorOf(error)
      if (api?.fieldErrors) {
        setErrors(api.fieldErrors as FieldErrors<Key>)
        setFormError(undefined)
      } else {
        setFormError(errorMessage(error))
      }
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next: FieldErrors<Key> = {
      email: validators.email(email.trim()),
      password: password ? undefined : 'Informe sua senha.',
    }
    setErrors(next)
    setFormError(undefined)
    if (Object.values(next).some(Boolean)) return
    mutation.mutate({ email: email.trim(), password })
  }

  return (
    <AuthShell subtitle="Entre para gerenciar sua carteira, coleção e perfil de criador.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <Field label="Senha" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        {formError && <p role="alert" className="text-sm text-coral">{formError}</p>}
        <button type="submit" disabled={mutation.isPending} className="h-[50px] w-full rounded-[10px] bg-primary font-bold text-primary-foreground disabled:opacity-60">
          {mutation.isPending ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Demonstração: ana@kurio.test ou bruno@kurio.test, senha Kurio@123
      </p>
    </AuthShell>
  )
}