'use client'

import React, { useCallback } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Card, CardBody } from '@heroui/card'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { Icon } from '@iconify/react'
import { Divider } from '@heroui/divider'
import { useUploaderChannel, useUploaderConnections, useWebRTCPeer } from '@/shared/hooks'
import { UploaderConnectionStatus } from '@/shared/types'
import { Spinner } from '@heroui/spinner'

interface ShareProps {
  props: {
    files: File[]
    fileMetaList: { name: string; type: string; size: string }[]
    clearFiles: () => void
  }
}

export const Share: React.FC<ShareProps> = ({ props }) => {
  const { files, fileMetaList, clearFiles } = props

  const { peer, stop } = useWebRTCPeer()
  const { isLoading, error, longSlug, shortSlug, longURL, shortURL } = useUploaderChannel(peer?.id)
  const connections = useUploaderConnections(peer, files, '')

  const handleStop = useCallback(() => {
    stop()
    clearFiles()
  }, [stop, clearFiles])

  const activeDownLoaders = connections.filter((conn) => conn.status === UploaderConnectionStatus.Uploading).length

  if (isLoading || !longSlug || !shortSlug) {
    return (
      <div className="w-full max-w-xl flex items-center justify-center gap-2">
        <Spinner color="primary" />
        <span>채널을 생성중입니다...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-xl flex items-center justify-center gap-2">
        <span>{error.message}</span>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center gap-8">
      {/* 파일 정보 리스트 */}
      <div className="w-full flex flex-col items-center justify-center gap-2">
        {fileMetaList.map((file, idx) => (
          <Card fullWidth key={idx}>
            <CardBody className="flex justify-between items-center">
              <div>
                <div className="font-bold">{file.name}</div>
                <div className="text-sm text-gray-500">
                  {file.type} - {file.size}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      {/* 공유 URL과 QR 코드 */}
      <div className="flex w-full items-center justify-between">
        <div className="mr-4">
          <QRCodeCanvas value={shortURL ?? ''} marginSize={4} />
        </div>
        <div className="flex flex-col flex-1 space-y-2">
          <Input
            label="Long URL"
            labelPlacement="outside"
            value={longURL ?? ''}
            readOnly
            endContent={
              <Button isIconOnly variant="bordered" size="sm">
                <Icon icon="solar:copy-linear" width="24" height="24" />
              </Button>
            }
          />
          <Input
            label="Short URL"
            labelPlacement="outside"
            value={shortURL ?? ''}
            readOnly
            endContent={
              <Button isIconOnly variant="bordered" size="sm">
                <Icon icon="solar:copy-linear" width="24" height="24" />
              </Button>
            }
          />
        </div>
      </div>
      <Divider />
      {/* 연결된 클라이언트 리스트 */}
      <div className="w-full">
        <h3 className="text-lg font-bold mb-2">연결된 클라이언트</h3>
        {activeDownLoaders === 0 ? (
          <div className="text-sm text-gray-500">현재 연결된 클라이언트 없음</div>
        ) : (
          connections.map((conn, i) => (
            <div key={i} className="flex justify-between items-center p-2 border-b">
              <span>Client: {conn.browserName}</span>
              <span>{Math.round(conn.currentFileProgress * 100)}%</span>
            </div>
          ))
        )}
      </div>
      {/* 업로드 중지 버튼 */}
      <div className="w-full flex justify-end">
        <Button size="sm" variant="flat" color="danger" onPress={handleStop}>
          업로드 중지
        </Button>
      </div>
    </div>
  )
}
