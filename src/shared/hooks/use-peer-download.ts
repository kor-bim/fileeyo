// shared/hooks/use-peer-download.ts
'use client'

import { useState, useEffect, useRef } from 'react'
import Peer, { DataConnection } from 'peerjs'
import { useSearchParams } from 'next/navigation'
import JSZip from 'jszip'

export interface FileMeta {
  name: string
  type: string
  size: number
}

interface DownloadState {
  isConnected: boolean
  filesMeta: FileMeta[] | null
  progress: number // 전체 진행률 (전체 바이트 대비)
  // downloadedFiles 배열: 각 파일의 Blob (파일이 아직 준비되지 않았다면 null)
  downloadedFiles: (Blob | null)[]
}

export function usePeerDownload() {
  const [state, setState] = useState<DownloadState>({
    isConnected: false,
    filesMeta: null,
    progress: 0,
    downloadedFiles: []
  })

  // 각 파일의 청크를 누적할 객체 (key: 파일 인덱스)
  const fileChunksRef = useRef<{ [key: number]: ArrayBuffer[] }>({})

  // 데이터 연결 참조
  const connectionRef = useRef<DataConnection | null>(null)
  const searchParams = useSearchParams()
  const uploaderId = searchParams.get('peerId')

  useEffect(() => {
    if (!uploaderId) return

    const peer = new Peer()
    peer.on('open', (id) => {
      console.log('Local peer opened with id:', id)
      const conn = peer.connect(uploaderId)
      connectionRef.current = conn
      conn.on('open', () => {
        console.log('Connection established to uploader', uploaderId)
        setState((prev) => ({ ...prev, isConnected: true }))
        // 다운로드 시작은 버튼 클릭 시 startDownload에서 처리합니다.
      })
      conn.on('data', (data: any) => {
        console.log('Received data:', data)
        if (data.type === 'fileMeta') {
          // 업로더가 파일 메타 정보를 배열로 전송한다고 가정합니다.
          const metas: FileMeta[] = data.meta
          setState((prev) => ({
            ...prev,
            filesMeta: metas,
            progress: 0,
            downloadedFiles: new Array(metas.length).fill(null)
          }))
          // 각 파일의 청크 배열 초기화
          const initialChunks: { [key: number]: ArrayBuffer[] } = {}
          metas.forEach((_, idx) => {
            initialChunks[idx] = []
          })
          fileChunksRef.current = initialChunks
        } else if (data.type === 'fileChunk') {
          // data.index: 파일 인덱스, data.chunk: ArrayBuffer
          const idx = data.index
          fileChunksRef.current[idx].push(data.chunk)
          if (state.filesMeta) {
            const totalReceived = Object.values(fileChunksRef.current).reduce(
              (sum, arr) => sum + arr.reduce((s, chunk) => s + chunk.byteLength, 0),
              0
            )
            const totalSize = state.filesMeta.reduce((sum, meta) => sum + meta.size, 0)
            const overallProgress = (totalReceived / totalSize) * 100
            setState((prev) => ({ ...prev, progress: overallProgress }))
          }
        } else if (data.type === 'downloadComplete') {
          // data.index: 파일 인덱스가 완료됨
          const idx = data.index
          if (state.filesMeta) {
            const blob = new Blob(fileChunksRef.current[idx], {
              type: state.filesMeta[idx].type
            })
            setState((prev) => {
              const newFiles = [...prev.downloadedFiles]
              newFiles[idx] = blob
              return { ...prev, downloadedFiles: newFiles }
            })
          }
        }
      })
    })
    peer.on('error', (err) => {
      console.error('Peer error:', err)
    })
    return () => {
      peer.destroy()
    }
  }, [uploaderId])

  // 모든 파일 다운로드 완료 시, ZIP 생성 및 자동 저장
  useEffect(() => {
    if (
      state.filesMeta &&
      state.downloadedFiles.length === state.filesMeta.length &&
      state.downloadedFiles.every((file) => file !== null)
    ) {
      const zip = new JSZip()
      state.filesMeta.forEach((meta, idx) => {
        zip.file(meta.name, state.downloadedFiles[idx] as Blob)
      })
      zip.generateAsync({ type: 'blob' }).then((zipBlob) => {
        const url = URL.createObjectURL(zipBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'download.zip'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      })
    }
  }, [state.filesMeta, state.downloadedFiles])

  // 다운로드 시작: 버튼 클릭 시 업로더에 메시지 전송
  const startDownload = () => {
    if (connectionRef.current) {
      connectionRef.current.send({ type: 'startDownload' })
    }
  }

  return { ...state, startDownload }
}
