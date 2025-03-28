'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'

function generateURL(slug: string): string {
  const { protocol, hostname, port } = window.location
  return `${protocol}//${hostname}${port ? `:${port}` : ''}/download/${slug}`
}

export function useUploaderChannel(uploaderPeerID: string | undefined, renewInterval = 60_000) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['uploaderChannel', uploaderPeerID],
    queryFn: async () => {
      const res = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploaderPeerID })
      })
      if (!res.ok) throw new Error('Failed to create channel')
      return res.json()
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  })

  const secret = data?.secret
  const longSlug = data?.longSlug
  const shortSlug = data?.shortSlug
  const longURL = longSlug && generateURL(longSlug)
  const shortURL = shortSlug && generateURL(shortSlug)

  const { mutate: renew } = useMutation({
    mutationFn: async ({ secret }: { secret: string }) => {
      const res = await fetch('/api/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: shortSlug, secret })
      })
      if (!res.ok) throw new Error('Failed to renew channel')
      return res.json()
    }
  })

  // 채널 자동 갱신
  useEffect(() => {
    if (!secret || !shortSlug) return

    const interval = setInterval(() => {
      console.log('[UploaderChannel] Renewing channel...')
      renew({ secret })
    }, renewInterval)

    return () => clearInterval(interval)
  }, [secret, shortSlug, renew, renewInterval])

  // 페이지 언로드 시 채널 제거
  useEffect(() => {
    if (!secret || !shortSlug) return

    const destroy = () => {
      console.log('[UploaderChannel] Destroying channel on unload...')
      navigator.sendBeacon('/api/destroy', JSON.stringify({ slug: shortSlug }))
    }

    window.addEventListener('beforeunload', destroy)
    return () => window.removeEventListener('beforeunload', destroy)
  }, [secret, shortSlug])

  return {
    isLoading,
    error,
    longSlug,
    shortSlug,
    longURL,
    shortURL
  }
}
