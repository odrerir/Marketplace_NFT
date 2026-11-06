export type FieldErrors<K extends string = string> = Partial<Record<K, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/
const EVM_RE = /^0x[0-9a-fA-F]{40}$/
const SOLANA_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export const validators = {
  username: (v: string) =>
    USERNAME_RE.test(v) ? undefined : 'Use de 3 a 20 letras, números ou _.',
  email: (v: string) => (EMAIL_RE.test(v) ? undefined : 'Informe um e-mail válido.'),
  password: (v: string) =>
    v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v)
      ? undefined
      : 'A senha precisa de 8 caracteres, com letras e números.',
  displayName: (v: string) =>
    v.trim().length >= 2 && v.trim().length <= 50 ? undefined : 'Informe seu nome (de 2 a 50 caracteres).',
  note: (v: string) => (v.length <= 200 ? undefined : 'Use no máximo 200 caracteres.'),
  nickname: (v: string) =>
    v.trim().length >= 2 && v.trim().length <= 30 ? undefined : 'Use de 2 a 30 caracteres.',
  walletAddress: (v: string, network: string) =>
    (network === 'solana' ? SOLANA_RE : EVM_RE).test(v)
      ? undefined
      : network === 'solana'
        ? 'Endereço Solana inválido.'
        : 'Informe um endereço 0x com 40 caracteres hexadecimais.',
}