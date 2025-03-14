import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/app/providers'
import { ReactNode } from 'react'
import { Hero } from '@/shared/components/hero'
import { ThemeButton } from '@/shared/components/theme-button'

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app'
}

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          <div className="relative w-full min-h-screen min-w-[360px] py-8 flex flex-col items-center justify-center">
            <Hero />
            <ThemeButton />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
