export type FieldErrors<K extends string = string> = Partial<Record<K, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

export const validators = {
  username: (v: string) =>
    USERNAME_RE.test(v) ? undefined : 'Use de 3 a 20 letras, números ou _.',
  email: (v: string) => (EMAIL_RE.test(v) ? undefined : 'Informe um e-mail válido.'),
  password: (v: string) =>
    v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v)
      ? undefined
      : 'A senha precisa de 8 caracteres, com letras e números.',
}