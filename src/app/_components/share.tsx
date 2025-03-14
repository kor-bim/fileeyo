'use client'

import React from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Card, CardBody } from '@heroui/card'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { Icon } from '@iconify/react'
import { Divider } from '@heroui/divider'

interface ClientInfo {
  id: string
  progress: number
}

interface ShareProps {
  props: {
    files: File[]
    fileMetaList: { name: string; type: string; size: string }[]
    shareUrl: string
    connectedClients: ClientInfo[]
    stopUpload: () => void
  }
}

export const Share: React.FC<ShareProps> = ({ props }) => {
  const { fileMetaList, shareUrl, connectedClients, stopUpload } = props

  return (
    <div className="w-full flex flex-col items-center gap-8">
      {/* 파일 정보 리스트 */}
      <div className="w-full flex flex-col gap-2">
        {fileMetaList.map((file, idx) => (
          <Card fullWidth key={idx}>
            <CardBody className="flex justify-between items-center">
              <div>
                <div className="font-bold">{file.name}</div>
                <div className="text-sm text-gray-500">
                  {file.type} - {file.size}
                </div>
              </div>
              <div className="text-sm">
                {/* 예시로 첫번째 클라이언트 진행률 표시 (실제는 각 클라이언트 별 진행률을 보여줌) */}
                {connectedClients.length > 0 ? `${Math.round(connectedClients[0].progress)}%` : '0%'}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
      {/* 공유 URL과 QR 코드 */}
      <div className="flex w-full items-center justify-between">
        <div className="mr-4">
          <QRCodeCanvas value={shareUrl} marginSize={4} />
        </div>
        <div className="flex flex-col flex-1 space-y-2">
          <Input
            label="Long URL"
            labelPlacement="outside"
            value={shareUrl}
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
            value={shareUrl}
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
        {connectedClients.length === 0 ? (
          <div className="text-sm text-gray-500">현재 연결된 클라이언트 없음</div>
        ) : (
          connectedClients.map((client) => (
            <div key={client.id} className="flex justify-between items-center p-2 border-b">
              <span>Client: {client.id}</span>
              <span>{Math.round(client.progress)}%</span>
            </div>
          ))
        )}
      </div>
      {/* 업로드 중지 버튼 */}
      <div className="w-full flex justify-end">
        <Button size="sm" variant="flat" color="danger" onPress={stopUpload}>
          업로드 중지
        </Button>
      </div>
    </div>
  )
}
