import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Erros 4xx são respostas definitivas: repetir não adianta. Falhas de rede e 5xx tentam de novo.
      retry: (failureCount, error) =>
        !(isAxiosError(error) && error.response && error.response.status < 500) && failureCount < 2,
    },
  },
})