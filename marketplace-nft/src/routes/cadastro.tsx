import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { register } from '@/api/auth'
import { Field } from '@/components/Field'
import { guestOnly, parseAuthSearch } from '@/features/auth/guards'
import { AuthShell } from '@/features/auth/AuthShell'
import { safeRedirect, startSession } from '@/lib/auth'
import { apiErrorOf, errorMessage } from '@/lib/errors'
import { validators } from '@/lib/validators'
import type { FieldErrors } from '@/lib/validators'

export const Route = createFileRoute('/cadastro')({
  validateSearch: parseAuthSearch,
  beforeLoad: guestOnly,
  component: RegisterPage,
})

type Key = 'username' | 'email' | 'password' | 'confirm'

function RegisterPage() {
  const { redirect } = Route.useSearch()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors<Key>>({})
  const [formError, setFormError] = useState<string>()

  const mutation = useMutation({
    mutationFn: register,
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
      username: validators.username(username.trim()),
      email: validators.email(email.trim()),
      password: validators.password(password),
      confirm: confirm === password ? undefined : 'As senhas não coincidem.',
    }
    setErrors(next)
    setFormError(undefined)
    if (Object.values(next).some(Boolean)) return
    mutation.mutate({ username: username.trim(), email: email.trim(), password })
  }

  return (
    <AuthShell subtitle="Crie seu perfil de colecionador e conecte uma carteira quando quiser.">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Nome de usuário" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} error={errors.username} />
        <Field label="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <Field label="Senha" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} hint="Mínimo de 8 caracteres, com letras e números." />
        <Field label="Confirmar senha" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
        {formError && <p role="alert" className="text-sm text-coral">{formError}</p>}
        <button type="submit" disabled={mutation.isPending} className="h-[50px] w-full rounded-[10px] bg-primary font-bold text-primary-foreground disabled:opacity-60">
          {mutation.isPending ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>
    </AuthShell>
  )
}