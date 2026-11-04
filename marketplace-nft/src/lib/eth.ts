const DECIMALS = 18
const SCALE = 10n ** 18n

/** "1.19" -> inteiro em wei (BigInt). */
export function toWei(value: string): bigint {
  const [int, frac = ''] = value.trim().split('.')
  if (!/^\d+$/.test(int) || !/^\d*$/.test(frac) || frac.length > DECIMALS) {
    throw new Error(`Valor em ETH inválido: ${value}`)
  }
  return BigInt(int) * SCALE + BigInt(frac.padEnd(DECIMALS, '0'))
}

/** wei -> "1.19" (mínimo de 2 casas, sem zeros à direita além disso). */
export function fromWei(wei: bigint): string {
  const int = wei / SCALE
  const frac = (wei % SCALE).toString().padStart(DECIMALS, '0').replace(/0+$/, '')
  return `${int}.${frac.padEnd(2, '0')}`
}