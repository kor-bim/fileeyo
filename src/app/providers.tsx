'use client'

import { ReactNode, useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { HeroUIProvider } from '@heroui/react'
import { addCollection } from '@iconify/react'
import customIcon from '@public/custom.json'

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  useEffect(() => {
    addCollection(customIcon)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </HeroUIProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
