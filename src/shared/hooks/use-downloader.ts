import { useCallback, useEffect, useRef, useState } from 'react'
import { DataConnection } from 'peerjs'
import { ChunkMessage, decodeMessage, MessageType } from '../types'
import { z } from 'zod'
import { browserName, browserVersion, mobileModel, mobileVendor, osName, osVersion } from 'react-device-detect'
import { streamDownloadMultipleFiles, streamDownloadSingleFile } from '@/shared/libs/download'
import { useWebRTCPeerConnection } from '@/shared/hooks'

const cleanErrorMessage = (error: string) =>
  error.startsWith('Could not connect to peer') ? '업로더에 연결할 수 없습니다. 브라우저가 닫혔을 수 있습니다.' : error

const getZipFilename = () => `fileeyo-${Date.now()}.zip`

export function useDownloader(uploaderPeerID: string) {
  const { peer } = useWebRTCPeerConnection()
  const [isPeerReady, setIsPeerReady] = useState(false)
  const [dataConnection, setDataConnection] = useState<DataConnection | null>(null)

  const [filesInfo, setFilesInfo] = useState<{ name: string; size: number; type: string }[] | null>(null)
  const [fileMetaList, setFileMetaList] = useState<{ name: string; size: string; type: string }[] | null>(null)

  const [isConnected, setIsConnected] = useState(false)
  const [isPasswordRequired, setIsPasswordRequired] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDone, setDone] = useState(false)
  const [bytesDownloaded, setBytesDownloaded] = useState(0)
  const [currentFileProgress, setCurrentFileProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const processChunk = useRef<((message: z.infer<typeof ChunkMessage>) => void) | null>(null)

  // 피어 준비 여부 추적
  useEffect(() => {
    if (!peer) return
    if (peer.open) setIsPeerReady(true)
    else peer.on('open', () => setIsPeerReady(true))
  }, [peer])

  useEffect(() => {
    if (!peer) return

    console.log('[📡 Downloader] 업로더에 연결 시도:', uploaderPeerID)
    const conn = peer.connect(uploaderPeerID, { reliable: true })
    setDataConnection(conn)

    const handleOpen = () => {
      console.log('[✅ Downloader] 연결됨')
      setIsConnected(true)
      conn.send({
        type: MessageType.RequestInfo,
        browserName,
        browserVersion,
        osName,
        osVersion,
        mobileVendor,
        mobileModel
      })
    }

    const handleData = (data: unknown) => {
      try {
        const msg = decodeMessage(data)
        console.log('[📥 Downloader ← Uploader]', msg)

        switch (msg.type) {
          case MessageType.PasswordRequired:
            setIsPasswordRequired(true)
            if (msg.errorMessage) setErrorMessage(msg.errorMessage)
            break
          case MessageType.Info:
            setFilesInfo(msg.files)
            setFileMetaList(msg.fileMetaList ?? null)
            break
          case MessageType.Chunk:
            processChunk.current?.(msg)
            break
          case MessageType.Error:
            console.error('[❌ 오류 메시지 수신]', msg.error)
            setErrorMessage(msg.error)
            conn.close()
            break
          case MessageType.Report:
            console.warn('[⚠️ 신고됨] 리디렉션')
            window.location.href = '/reported'
            break
        }
      } catch (err) {
        console.error('[❌ 메시지 파싱 실패]', err)
      }
    }

    const handleClose = () => {
      console.log('[🔌 Downloader] 연결 종료됨')
      setIsConnected(false)
      setIsDownloading(false)
      setDataConnection(null)
    }

    const handleError = (err: Error) => {
      console.error('[❌ 연결 오류]', err.message)
      setErrorMessage(cleanErrorMessage(err.message))

      if (conn.open) conn.close()
      else handleClose()
    }

    conn.on('open', handleOpen)
    conn.on('data', handleData)
    conn.on('close', handleClose)
    conn.on('error', handleError)
    peer.on('error', handleError)

    return () => {
      console.log('[♻️ Downloader] 연결 정리')
      if (conn.open) conn.close()
      else conn.once('open', () => conn.close())

      conn.off('open', handleOpen)
      conn.off('data', handleData)
      conn.off('close', handleClose)
      conn.off('error', handleError)
      peer.off('error', handleError)
    }
  }, [peer, uploaderPeerID])

  const submitPassword = useCallback(
    (password: string) => {
      if (!dataConnection) return
      console.log('[📤 비밀번호 제출]')
      dataConnection.send({
        type: MessageType.UsePassword,
        password
      })
    },
    [dataConnection]
  )

  const startDownload = useCallback(() => {
    if (!filesInfo || !dataConnection) return
    console.log('[⬇️ 다운로드 시작]')
    setIsDownloading(true)

    const streamMap: Record<
      string,
      {
        stream: ReadableStream<Uint8Array>
        enqueue: (chunk: Uint8Array) => void
        close: () => void
      }
    > = {}

    const streams = filesInfo.map((file) => {
      let enqueue: ((chunk: Uint8Array) => void) | null = null
      let close: (() => void) | null = null

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          enqueue = (chunk) => controller.enqueue(chunk)
          close = () => controller.close()
        }
      })

      if (!enqueue || !close) throw new Error('Stream 초기화 실패')

      streamMap[file.name] = { stream, enqueue, close }
      return stream
    })

    let currentIndex = 0

    const startNextFile = () => {
      if (currentIndex >= filesInfo.length) return
      const file = filesInfo[currentIndex]
      console.log('[📤 파일 요청]', file.name)

      dataConnection.send({
        type: MessageType.Start,
        fileName: file.name,
        offset: 0
      })

      currentIndex++
    }

    processChunk.current = (msg) => {
      const streamEntry = streamMap[msg.fileName]
      if (!streamEntry) return

      const total = filesInfo?.find((f) => f.name === msg.fileName)?.size || 1
      const offset = msg.offset ?? 0
      const chunkSize = (msg.bytes as ArrayBuffer).byteLength
      const downloaded = offset + chunkSize

      setCurrentFileProgress(downloaded / total)
      setBytesDownloaded((prev) => prev + chunkSize)
      streamEntry.enqueue(new Uint8Array(msg.bytes as ArrayBuffer))

      if (msg.final) {
        console.log('[✅ 파일 완료]', msg.fileName)
        streamEntry.close()
        setCurrentFileProgress(0)
        startNextFile()
      }
    }

    const downloads = filesInfo.map((file, i) => ({
      name: file.name.replace(/^\//, ''),
      size: file.size,
      stream: () => streams[i]
    }))

    const task =
      downloads.length > 1
        ? streamDownloadMultipleFiles(downloads, getZipFilename())
        : streamDownloadSingleFile(downloads[0], downloads[0].name)

    task
      .then(() => {
        console.log('[✅ 전체 다운로드 완료]')
        dataConnection.send({ type: MessageType.Done })
        setDone(true)
      })
      .catch((err) => {
        console.error('[❌ 다운로드 실패]', err)
        setErrorMessage(err.message)
      })

    startNextFile()
  }, [dataConnection, filesInfo])

  const stopDownload = useCallback(() => {
    if (dataConnection) {
      console.log('[⏸ 다운로드 중지]')
      dataConnection.send({ type: MessageType.Pause })
      dataConnection.close()
    }
    setIsDownloading(false)
    setDone(false)
    setBytesDownloaded(0)
    setCurrentFileProgress(0)
    setErrorMessage(null)
  }, [dataConnection])

  return {
    filesInfo,
    fileMetaList,
    isPeerReady,
    isConnected,
    isPasswordRequired,
    isDownloading,
    isDone,
    currentFileProgress,
    bytesDownloaded,
    totalSize: filesInfo?.reduce((acc, f) => acc + f.size, 0) ?? 0,
    errorMessage,
    submitPassword,
    startDownload,
    stopDownload
  }
}
