import { useEffect, useRef, useState } from 'react'
import type { InputHTMLAttributes } from 'react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  q?: string
  onSearch: (q?: string) => void
}

export function SearchInput({ q, onSearch, ...inputProps }: Props) {
  const [value, setValue] = useState(q ?? '')
  const pushed = useRef(q ?? '')
  const onSearchRef = useRef(onSearch)

  useEffect(() => {
    onSearchRef.current = onSearch
  })

  // A URL mudou por fora (voltar/avançar do navegador): atualiza o campo
  useEffect(() => {
    if ((q ?? '') !== pushed.current) {
      pushed.current = q ?? ''
      setValue(q ?? '')
    }
  }, [q])

  // Só escreve na URL depois de 300 ms sem digitar
  useEffect(() => {
    const next = value.trim()
    if (next === pushed.current) return
    const id = setTimeout(() => {
      pushed.current = next
      onSearchRef.current(next || undefined)
    }, 300)
    return () => clearTimeout(id)
  }, [value])

  return <input type="search" value={value} onChange={(e) => setValue(e.target.value)} {...inputProps} />
}