'use client'

import { useState, useEffect, useCallback } from 'react'
import { destroyPeerInstance, getPeerInstance } from '@/shared/libs/peer-manager'
import type Peer from 'peerjs'

export function useWebRTCPeerConnection() {
  const [peer, setPeer] = useState<Peer | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const stop = useCallback(() => {
    destroyPeerInstance()
    setPeer(null)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    getPeerInstance()
      .then((peer) => {
        setPeer(peer)
        setIsLoading(false)
      })
      .catch((err) => {
        setError(err)
        setIsLoading(false)
      })
  }, [])

  return { peer, stop, error, isLoading }
}
