'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'

function buildDownloadURL(slug: string): string {
  const { protocol, hostname, port } = window.location
  return `${protocol}//${hostname}${port ? `:${port}` : ''}/download/${slug}`
}

/**
 * 업로더 채널을 생성하고, 일정 간격으로 갱신하며,
 * 페이지 언로드 시 자동으로 제거하는 커스텀 훅
 */
export function useUploaderChannel(uploaderPeerID: string | undefined, renewInterval = 60_000) {
  // 채널 생성 (최초 1회)
  const { data, isLoading, error } = useQuery({
    queryKey: ['uploaderChannel', uploaderPeerID],
    queryFn: async () => {
      const res = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploaderPeerID })
      })
      if (!res.ok) throw new Error('채널 생성 실패')
      return res.json()
    },
    enabled: !!uploaderPeerID,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false
  })

  const secret = data?.secret
  const shortSlug = data?.shortSlug
  const longSlug = data?.longSlug

  const shortURL = useMemo(() => shortSlug && buildDownloadURL(shortSlug), [shortSlug])
  const longURL = useMemo(() => longSlug && buildDownloadURL(longSlug), [longSlug])

  const { mutate: renewChannel } = useMutation({
    mutationFn: async ({ secret }: { secret: string }) => {
      const res = await fetch('/api/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: shortSlug, secret })
      })
      if (!res.ok) throw new Error('채널 갱신 실패')
      return res.json()
    }
  })

  // 갱신 + 언로드 정리 통합
  useEffect(() => {
    if (!secret || !shortSlug) return

    console.log('[UploaderChannel] 채널 갱신 및 제거 등록')

    const interval = setInterval(() => {
      console.log('[UploaderChannel] 채널 갱신')
      renewChannel({ secret })
    }, renewInterval)

    const handleUnload = () => {
      console.log('[UploaderChannel] 언로드 → 채널 제거')
      navigator.sendBeacon('/api/destroy', JSON.stringify({ slug: shortSlug }))
    }

    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [secret, shortSlug, renewChannel, renewInterval])

  return {
    isLoading,
    error,
    longSlug,
    shortSlug,
    longURL,
    shortURL
  }
}
