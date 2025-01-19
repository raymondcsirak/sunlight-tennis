// Marcam acest fisier ca fiind componenta client-side
"use client"

// Importuri pentru React Query si hook-ul useState
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

// Componenta Providers care configureaza React Query pentru intreaga aplicatie
export function Providers({ children }: { children: React.ReactNode }) {
  // Initializam clientul React Query cu useState pentru a pastra o singura instanta
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Setam timpul dupa care datele sunt considerate invechite (stale)
        staleTime: 60 * 1000, // 1 minut
        // Dezactivam reincarcarea datelor la focus-ul ferestrei
        refetchOnWindowFocus: false,
      },
    },
  }))

  // Furnizam clientul React Query catre toate componentele copil
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
} 