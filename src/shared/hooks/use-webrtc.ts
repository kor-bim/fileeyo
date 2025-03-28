'use client'

import { useState, useEffect, useCallback } from 'react'
import Peer from 'peerjs'

let globalPeer: Peer | null = null

export function useWebRTCPeer() {
  const [peer, setPeer] = useState<Peer | null>(globalPeer)
  const [error, setError] = useState<Error | null>(null)

  const stop = useCallback(() => {
    globalPeer?.destroy()
    globalPeer = null
    setPeer(null)
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const { iceServers } = await fetch('/api/ice', { method: 'POST' }).then((res) => res.json())
        const p = new Peer({ config: { iceServers }, debug: 2 })

        p.on('open', () => {
          globalPeer = p
          setPeer(p)
        })

        p.on('error', setError)
      } catch (err) {
        setError(err as Error)
      }
    }

    init().then((r) => console.log(r))
  }, [])

  return { peer, stop, error, isLoading: !peer && !error }
}
