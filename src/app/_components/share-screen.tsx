'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Card, CardBody } from '@heroui/card'
import { Button } from '@heroui/button'
import { Divider } from '@heroui/divider'
import { Spinner } from '@heroui/spinner'
import { Snippet } from '@heroui/snippet'
import { Progress } from '@heroui/progress'
import { useUploaderChannel, useUploaderConnections, useWebRTCPeerConnection } from '@/shared/hooks'
import { ShareStep } from '@/shared/types'

export const ShareScreen = ({ files, fileMetaList, password }: ShareStep) => {
  const { peer, stop, isLoading: isPeerLoading } = useWebRTCPeerConnection()
  const { isLoading: isChannelLoading, longURL, shortURL } = useUploaderChannel(peer?.id)
  const connections = useUploaderConnections(peer, files, password, fileMetaList)
  console.log(connections)

  if (isPeerLoading || isChannelLoading) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Spinner size="lg" color="primary" />
        <span>{isPeerLoading ? '피어 연결중...' : '채널을 생성중입니다...'}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* 파일 정보 리스트 */}
      <div className="w-full flex flex-col items-center justify-center gap-2">
        {fileMetaList.map((file, idx) => (
          <Card fullWidth key={idx}>
            <CardBody className="w-full flex flex-row items-center justify-between gap-2 overflow-hidden">
              <div className="flex flex-col gap-1 basis-2/3 overflow-hidden">
                <span className="line-clamp-1">{file.name}</span>
                <span className="line-clamp-1 text-xs text-default-400">{file.type}</span>
              </div>
              <span className="text-lg text-default-500 font-bold text-right truncate">{file.size}</span>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* 🔗 공유 링크 & QR */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-8">
        <QRCodeSVG value={shortURL ?? ''} marginSize={4} className="w-full h-full flex-1" />
        <div className="w-full flex-2 flex flex-col tems-start justify-center gap-2">
          <span className="text-xs text-default-500 font-bold">Long URL</span>
          <Snippet fullWidth hideSymbol color="primary" classNames={{ pre: 'whitespace-pre-wrap break-all' }}>
            {longURL ?? ''}
          </Snippet>
          <span className="text-xs text-default-500 font-bold">Short URL</span>
          <Snippet fullWidth hideSymbol color="primary" classNames={{ pre: 'whitespace-pre-wrap break-all' }}>
            {shortURL ?? ''}
          </Snippet>
        </div>
      </div>

      <Divider />

      {/* 👥 클라이언트 목록 */}
      <div className="w-full flex flex-col items-start justify-center gap-6">
        <h3 className="text-md font-semibold mb-2">연결된 클라이언트</h3>
        {connections.length === 0 ? (
          <span className="text-sm text-gray-500">현재 연결된 클라이언트 없음</span>
        ) : (
          connections.map((conn, i) => (
            <Progress
              key={i}
              showValueLabel={true}
              label={conn.browserName}
              value={Math.round(conn.currentFileProgress * 100)}
            />
          ))
        )}
      </div>

      {/* 🛑 업로드 중지 */}
      <div className="flex justify-end">
        <Button variant="flat" color="danger" size="sm" onPress={stop}>
          업로드 중지
        </Button>
      </div>
    </div>
  )
}
