// shared/hooks/use-peer-connection.ts
'use client'

import { useState, useEffect } from 'react'
import Peer, { DataConnection } from 'peerjs'

interface FileMeta {
  name: string
  type: string
  size: string
}

interface ClientInfo {
  id: string
  connection: DataConnection
  progress: number
}

interface InitiateParams {
  files: File[]
  fileMetaList: FileMeta[]
}

export function usePeerConnection() {
  const [peerInstance, setPeerInstance] = useState<Peer | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [connectedClients, setConnectedClients] = useState<ClientInfo[]>([])
  const [filesRef, setFilesRef] = useState<File[]>([])
  const [fileMetaRef, setFileMetaRef] = useState<FileMeta[]>([])

  const initiatePeer = ({ files, fileMetaList }: InitiateParams) => {
    const peer = new Peer()
    setFilesRef(files)
    setFileMetaRef(fileMetaList)

    peer.on('open', (id) => {
      setShareUrl(`${window.location.origin}/download?peerId=${id}`)
    })

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        setConnectedClients((prev) => [...prev, { id: conn.peer, connection: conn, progress: 0 }])

        conn.on('data', (data: any) => {
          if (data.type === 'startDownload') {
            const file = files[0]
            const meta = fileMetaList[0]
            conn.send({ type: 'fileMeta', meta })

            const chunkSize = 64 * 1024
            let offset = 0
            const total = file.size
            const reader = new FileReader()

            const sendChunk = () => {
              const slice = file.slice(offset, offset + chunkSize)
              reader.readAsArrayBuffer(slice)
            }

            reader.onload = () => {
              conn.send({ type: 'fileChunk', chunk: reader.result })
              offset += chunkSize
              const progress = (offset / total) * 100

              setConnectedClients((prev) => prev.map((c) => (c.id === conn.peer ? { ...c, progress } : c)))

              if (offset < total) {
                sendChunk()
              } else {
                conn.send({ type: 'downloadComplete' })
              }
            }

            sendChunk()
          }
        })
      })
    })

    setPeerInstance(peer)
  }

  const stopUpload = () => {
    connectedClients.forEach((c) => c.connection.close())
    peerInstance?.destroy()
    setConnectedClients([])
    setPeerInstance(null)
    setShareUrl(null)
  }

  useEffect(() => {
    return () => {
      peerInstance?.destroy()
    }
  }, [peerInstance])

  return { shareUrl, initiatePeer, connectedClients, stopUpload }
}
