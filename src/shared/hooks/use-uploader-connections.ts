import Peer, { DataConnection } from 'peerjs'
import { useEffect, useState } from 'react'
import {
  decodeMessage,
  Message,
  MessageType,
  UploadedFile,
  UploaderConnection,
  UploaderConnectionStatus
} from '../types'
import { getFileName } from '@/shared/libs/fs'

const MAX_CHUNK_SIZE = 256 * 1024 // 256 KB

/**
 * 주어진 파일 목록에서 유효한 오프셋의 파일을 반환
 */
function validateOffset(files: UploadedFile[], fileName: string, offset: number): UploadedFile {
  const file = files.find((f) => getFileName(f) === fileName && offset <= f.size)
  if (!file) throw new Error('invalid file offset')
  return file
}

/**
 * 업로더 피어에서 수신되는 연결 및 메시지에 대한 처리 로직을 관리합니다.
 * 다운로더의 연결, 인증, 전송 제어를 포함합니다.
 *
 * @param peer - PeerJS 인스턴스
 * @param files - 업로드 대상 파일 목록
 * @param password - 접근 제어용 비밀번호 (없을 경우 생략 가능)
 * @returns 연결 상태 목록
 */
export function useUploaderConnections(
  peer: Peer | null,
  files: UploadedFile[],
  password: string
): UploaderConnection[] {
  const [connections, setConnections] = useState<UploaderConnection[]>([])

  useEffect(() => {
    const cleanupHandlers: Array<() => void> = []

    const handleConnection = (conn: DataConnection) => {
      if (conn.metadata?.type === 'report') {
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

      let sendChunkTimeout: NodeJS.Timeout | null = null

      const connState: UploaderConnection = {
        dataConnection: conn,
        status: UploaderConnectionStatus.Pending,
        completedFiles: 0,
        totalFiles: files.length,
        currentFileProgress: 0
      }

      setConnections((prev) => [connState, ...prev])

      const updateConnection = (fn: (c: UploaderConnection) => UploaderConnection) => {
        setConnections((prev) => prev.map((c) => (c.dataConnection === conn ? fn(c) : c)))
      }

      const getFileInfo = () =>
        files.map((f) => ({
          fileName: getFileName(f),
          size: f.size,
          type: f.type
        }))

      const onData = (data: any) => {
        try {
          const msg = decodeMessage(data)

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

              const nextStatus = password ? UploaderConnectionStatus.Authenticating : UploaderConnectionStatus.Ready

              updateConnection((c) =>
                c.status === UploaderConnectionStatus.Pending ? { ...c, ...deviceInfo, status: nextStatus } : c
              )

              const response: Message = password
                ? { type: MessageType.PasswordRequired }
                : { type: MessageType.Info, files: getFileInfo() }

              conn.send(response)
              break
            }

            case MessageType.UsePassword: {
              const isValid = msg.password === password
              const nextStatus = isValid ? UploaderConnectionStatus.Ready : UploaderConnectionStatus.InvalidPassword

              updateConnection((c) =>
                [UploaderConnectionStatus.Authenticating, UploaderConnectionStatus.InvalidPassword].includes(c.status)
                  ? { ...c, status: nextStatus }
                  : c
              )

              const response: Message = isValid
                ? { type: MessageType.Info, files: getFileInfo() }
                : { type: MessageType.PasswordRequired, errorMessage: 'Invalid password' }

              conn.send(response)
              break
            }

            case MessageType.Start: {
              const { fileName, offset: startOffset } = msg
              let offset = startOffset
              const file = validateOffset(files, fileName, offset)

              const sendNextChunk = () => {
                sendChunkTimeout = setTimeout(() => {
                  const end = Math.min(file.size, offset + MAX_CHUNK_SIZE)
                  const chunk = file.slice(offset, end)
                  const final = end === file.size

                  conn.send({
                    type: MessageType.Chunk,
                    fileName,
                    offset,
                    bytes: chunk,
                    final
                  })

                  offset = end

                  updateConnection((c) => {
                    const updated: Partial<UploaderConnection> = final
                      ? {
                          completedFiles: c.completedFiles + 1,
                          currentFileProgress: 0,
                          status: UploaderConnectionStatus.Ready
                        }
                      : {
                          uploadingOffset: offset,
                          currentFileProgress: offset / file.size
                        }

                    if (!final) sendNextChunk()
                    return { ...c, ...updated }
                  })
                }, 0)
              }

              updateConnection((c) =>
                [UploaderConnectionStatus.Ready, UploaderConnectionStatus.Paused].includes(c.status)
                  ? {
                      ...c,
                      status: UploaderConnectionStatus.Uploading,
                      uploadingFileName: fileName,
                      uploadingOffset: offset,
                      currentFileProgress: offset / file.size
                    }
                  : c
              )

              sendNextChunk()
              break
            }

            case MessageType.Pause: {
              if (sendChunkTimeout) clearTimeout(sendChunkTimeout)
              updateConnection((c) =>
                c.status === UploaderConnectionStatus.Uploading ? { ...c, status: UploaderConnectionStatus.Paused } : c
              )
              break
            }

            case MessageType.Done: {
              updateConnection((c) =>
                c.status === UploaderConnectionStatus.Ready ? { ...c, status: UploaderConnectionStatus.Done } : c
              )
              conn.close()
              break
            }
          }
        } catch (err) {
          console.error('[UploaderConnections] 메시지 처리 중 오류:', err)
        }
      }

      const onClose = () => {
        if (sendChunkTimeout) clearTimeout(sendChunkTimeout)

        updateConnection((c) =>
          [UploaderConnectionStatus.Done, UploaderConnectionStatus.InvalidPassword].includes(c.status)
            ? c
            : { ...c, status: UploaderConnectionStatus.Closed }
        )
      }

      conn.on('data', onData)
      conn.on('close', onClose)

      cleanupHandlers.push(() => {
        conn.off('data', onData)
        conn.off('close', onClose)
        conn.close()
      })
    }

    peer?.on('connection', handleConnection)

    return () => {
      peer?.off('connection', handleConnection)
      cleanupHandlers.forEach((fn) => fn())
    }
  }, [peer, files, password])

  return connections
}
