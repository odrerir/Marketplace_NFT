import { ws } from 'msw'
import { REALTIME_URL } from '@/lib/realtime'

const realtime = ws.link(REALTIME_URL)
const PING_INTERVAL_MS = 20_000

export const realtimeHandlers = [
  realtime.addEventListener('connection', (connection) => {

    // O binding não envia o "ping" do Engine.IO (pacote "2"). Sem ele, o cliente
    // considera a conexão morta depois de ~30 s e derruba.
    const ping = setInterval(() => connection.client.send('2'), PING_INTERVAL_MS)
    connection.client.addEventListener('close', () => clearInterval(ping))

  }),
]