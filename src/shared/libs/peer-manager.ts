// peerManager.ts
import Peer from 'peerjs'

let peerInstance: Peer | null = null
let initPromise: Promise<Peer> | null = null

export async function initializePeer(): Promise<Peer> {
  const response = await fetch('/api/ice', { method: 'POST' })
  const { iceServers } = await response.json()
  console.log('[WebRTC] ICE 서버 불러옴')

  const peer = new Peer({
    debug: 2,
    config: { iceServers }
  })

  await new Promise<void>((resolve, reject) => {
    const handleOpen = (id: string) => {
      console.log('[WebRTC] 피어 ID:', id)
      peer.off('open', handleOpen)
      resolve()
    }

    const handleError = (err: Error) => {
      console.log('[WebRTC] 오류 발생:', err)
      peer.off('error', handleError)
      reject(err)
    }

    peer.once('open', handleOpen)
    peer.once('error', handleError)
  })

  return peer
}

export async function getPeerInstance(): Promise<Peer> {
  if (peerInstance) return peerInstance
  if (!initPromise) {
    initPromise = initializePeer().then((peer) => {
      peerInstance = peer
      return peer
    })
  }
  return initPromise
}

export function destroyPeerInstance() {
  console.log('[WebRTC] 피어 인스턴스 제거')
  peerInstance?.destroy()
  peerInstance = null
  initPromise = null
}
