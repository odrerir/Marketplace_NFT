/** Host fictício: o MSW intercepta este endereço, nada real responde nele. */
export const REALTIME_URL: string =
  import.meta.env.VITE_REALTIME_URL ?? 'wss://realtime.kurio.mock'