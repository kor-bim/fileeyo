import { useEffect, useState } from 'react'
import Peer, { DataConnection } from 'peerjs'
import { UploadedFile, UploaderConnection, UploaderConnectionStatus, Message, MessageType } from '../types'
import { getFileName } from '@/shared/libs/fs'
import { decodeMessage } from '../types'

// ✅ 파일 메타 정보 타입
export type FileMeta = {
  name: string
  size: string
  type: string
}

const MAX_CHUNK_SIZE = 256 * 1024 // 256KB

function validateOffset(files: UploadedFile[], fileName: string, offset: number): UploadedFile {
  const file = files.find((f) => getFileName(f) === fileName && offset <= f.size)
  if (!file) throw new Error('Invalid file or offset')
  return file
}

/**
 * 📡 업로더 측에서 다운로더 연결을 처리하고 상태 및 메시지를 관리하는 커스텀 훅
 */
export function useUploaderConnections(
  peer: Peer | null,
  files: UploadedFile[],
  password: string,
  fileMetaList: FileMeta[]
): UploaderConnection[] {
  const [connections, setConnections] = useState<UploaderConnection[]>([])

  useEffect(() => {
    if (!peer) return

    const activeConnections = new Set<DataConnection>()

    /**
     * 연결 상태 업데이트 유틸
     */
    const updateConnection = (conn: DataConnection, updater: (c: UploaderConnection) => UploaderConnection) => {
      setConnections((prev) => prev.map((c) => (c.dataConnection === conn ? updater(c) : c)))
    }

    /**
     * 📥 새로운 다운로더 연결 처리
     */
    const handleConnection = (conn: DataConnection) => {
      if (conn.metadata?.type === 'report') {
        console.warn('[⚠️ Report] 다운로더가 신고 요청함')
        setConnections((prev) => {
          prev.forEach((c) => {
            c.dataConnection.send({ type: MessageType.Report })
            c.dataConnection.close()
          })
          return []
        })
        window.location.href = '/reported'
        return
      }

      activeConnections.add(conn)

      let sendChunkTimeout: NodeJS.Timeout | null = null

      // 초기 연결 상태 저장
      const connState: UploaderConnection = {
        dataConnection: conn,
        status: UploaderConnectionStatus.Pending,
        completedFiles: 0,
        totalFiles: files.length,
        currentFileProgress: 0
      }

      setConnections((prev) => [connState, ...prev])

      const send = (msg: Message) => {
        console.log('[📤 Uploader → Downloader]', msg)
        conn.send(msg)
      }

      // 🧾 파일 정보 + 파일 메타 전송
      const sendFileInfo = () => {
        const infoMessage: Message = {
          type: MessageType.Info,
          files: files.map((f) => ({
            name: getFileName(f),
            size: f.size,
            type: f.type
          })),
          fileMetaList
        }
        console.log('[📤 Uploader → Downloader] 파일 정보 전송', infoMessage)
        send(infoMessage)
      }

      /**
       * 📦 파일 전송 시작
       */
      const startTransfer = (fileName: string, startOffset: number) => {
        let offset = startOffset
        const file = validateOffset(files, fileName, offset)

        updateConnection(conn, (c) => ({
          ...c,
          status: UploaderConnectionStatus.Uploading,
          uploadingFileName: fileName,
          uploadingOffset: offset,
          currentFileProgress: offset / file.size
        }))

        const sendChunk = () => {
          sendChunkTimeout = setTimeout(() => {
            const end = Math.min(file.size, offset + MAX_CHUNK_SIZE)
            const chunk = file.slice(offset, end)
            const final = end === file.size

            const chunkMessage: Message = {
              type: MessageType.Chunk,
              fileName,
              offset,
              bytes: chunk,
              final
            }
            console.log('[📤 Uploader → Downloader] Chunk 전송', chunkMessage)
            send(chunkMessage)

            offset = end

            updateConnection(conn, (c) => {
              if (final) {
                return {
                  ...c,
                  completedFiles: c.completedFiles + 1,
                  currentFileProgress: 0,
                  status: UploaderConnectionStatus.Ready
                }
              } else {
                sendChunk()
                return {
                  ...c,
                  uploadingOffset: offset,
                  currentFileProgress: offset / file.size
                }
              }
            })
          }, 0)
        }

        sendChunk()
      }

      /**
       * ⏸ 파일 전송 일시 중지
       */
      const pauseTransfer = () => {
        if (sendChunkTimeout) clearTimeout(sendChunkTimeout)
        updateConnection(conn, (c) =>
          c.status === UploaderConnectionStatus.Uploading ? { ...c, status: UploaderConnectionStatus.Paused } : c
        )
      }

      /**
       * ✅ 전체 전송 완료
       */
      const completeTransfer = () => {
        updateConnection(conn, (c) =>
          c.status === UploaderConnectionStatus.Ready ? { ...c, status: UploaderConnectionStatus.Done } : c
        )
        conn.close()
      }

      /**
       * 📥 다운로더가 보낸 메시지 처리
       */
      const handleMessage = (msg: Message) => {
        console.log('[📥 Downloader → Uploader]', msg)

        switch (msg.type) {
          case MessageType.RequestInfo: {
            const deviceInfo = {
              browserName: msg.browserName,
              browserVersion: msg.browserVersion,
              osName: msg.osName,
              osVersion: msg.osVersion,
              mobileVendor: msg.mobileVendor,
              mobileModel: msg.mobileModel
            }

            updateConnection(conn, (c) =>
              c.status === UploaderConnectionStatus.Pending
                ? {
                    ...c,
                    ...deviceInfo,
                    status: password ? UploaderConnectionStatus.Authenticating : UploaderConnectionStatus.Ready
                  }
                : c
            )

            if (password) {
              send({ type: MessageType.PasswordRequired })
            } else {
              sendFileInfo()
            }
            break
          }

          case MessageType.UsePassword: {
            const isValid = msg.password === password
            console.log('[📥 Downloader → Uploader] 비밀번호 인증 시도:', msg.password)

            updateConnection(conn, (c) =>
              [UploaderConnectionStatus.Authenticating, UploaderConnectionStatus.InvalidPassword].includes(c.status)
                ? {
                    ...c,
                    status: isValid ? UploaderConnectionStatus.Ready : UploaderConnectionStatus.InvalidPassword
                  }
                : c
            )

            const response: Message = isValid
              ? {
                  type: MessageType.Info,
                  files: files.map((f) => ({
                    name: getFileName(f),
                    size: f.size,
                    type: f.type
                  })),
                  fileMetaList
                }
              : {
                  type: MessageType.PasswordRequired,
                  errorMessage: 'Invalid password'
                }

            console.log('[📤 Uploader → Downloader] 인증 응답 전송:', response)
            send(response)
            break
          }

          case MessageType.Start:
            startTransfer(msg.fileName, msg.offset)
            break

          case MessageType.Pause:
            pauseTransfer()
            break

          case MessageType.Done:
            completeTransfer()
            break
        }
      }

      // 연결 종료 처리
      const onClose = () => {
        if (sendChunkTimeout) clearTimeout(sendChunkTimeout)

        updateConnection(conn, (c) =>
          [UploaderConnectionStatus.Done, UploaderConnectionStatus.InvalidPassword].includes(c.status)
            ? c
            : { ...c, status: UploaderConnectionStatus.Closed }
        )
        activeConnections.delete(conn)
      }

      // 메시지 수신 처리 등록
      conn.on('data', (raw) => {
        try {
          const msg = decodeMessage(raw)
          handleMessage(msg)
        } catch (err) {
          console.error('[Uploader] 메시지 파싱 오류:', err)
        }
      })

      conn.on('close', onClose)
    }

    // 피어 연결 수신 처리 등록
    peer.on('connection', handleConnection)

    return () => {
      peer.off('connection', handleConnection)
      activeConnections.forEach((conn) => {
        conn.off('data')
        conn.off('close')
        conn.close()
      })
      activeConnections.clear()
    }
  }, [peer, files, password, fileMetaList])

  return connections
}
