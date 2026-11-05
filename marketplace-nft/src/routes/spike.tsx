import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getSocket } from '@/lib/socket'

export const Route = createFileRoute('/spike')({ component: Spike })

function Spike() {
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    let cleanup: (() => void) | undefined
    const add = (msg: string) =>
      setLog((l) => [...l, `${new Date().toLocaleTimeString()}  ${msg}`])

    getSocket().then((socket) => {
      if (cancelled) return
      const onConnect = () => {
        add('connect')
        socket.emit('spike.ping', 'olá')
      }
      const onDisconnect = (reason: string) => add(`disconnect: ${reason}`)
      const onError = (e: Error) => add(`connect_error: ${e.message}`)
      const onPong = (p: unknown) => add(`spike.pong ${JSON.stringify(p)}`)

      socket.on('connect', onConnect)
      socket.on('disconnect', onDisconnect)
      socket.on('connect_error', onError)
      socket.on('spike.pong', onPong)

      if (socket.connected) onConnect()
      else socket.connect()

      cleanup = () => {
        socket.off('connect', onConnect)
        socket.off('disconnect', onDisconnect)
        socket.off('connect_error', onError)
        socket.off('spike.pong', onPong)
        socket.disconnect()
      }
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  const drop = async () => (await getSocket()).emit('spike.drop')

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-xl font-bold">Spike Socket.IO + MSW</h1>
      <button type="button" onClick={drop} className="mb-4 rounded-[8px] bg-primary px-4 py-2 font-bold text-primary-foreground">
        Derrubar conexão
      </button>
      <ul className="space-y-1 text-sm">
        {log.map((line, i) => <li key={i}>{line}</li>)}
      </ul>
    </main>
  )
}