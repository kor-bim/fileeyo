'use client'

import { useDownloader } from '@/shared/hooks'
import { Card, CardBody } from '@heroui/card'
import React from 'react'
import { Button } from '@heroui/button'
import { Progress } from '@heroui/progress'

export const Downloader = ({ peerId }: { peerId: string }) => {
  const {
    filesInfo,
    isConnected,
    isDownloading,
    isDone,
    errorMessage,
    startDownload,
    stopDownload,
    totalSize,
    bytesDownloaded
  } = useDownloader(peerId)

  if (!isConnected) return <span>연결 실패</span>
  if (errorMessage) return <span>{errorMessage}</span>

  return (
    <div className="w-full flex flex-col items-center justify-center gap-2">
      {filesInfo ? (
        <>
          <div className="w-full flex flex-col items-center justify-center gap-2">
            {filesInfo.map((file, idx) => (
              <Card fullWidth key={idx}>
                <CardBody className="flex justify-between items-center">
                  <div>
                    <div className="font-bold">{file.fileName}</div>
                    <div className="text-sm text-gray-500">
                      {file.type} - {file.size}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
          {isDone ? (
            <span>다운로드 완료</span>
          ) : isDownloading ? (
            <div className="w-full flex flex-col items-center justify-center gap-2">
              <Progress
                aria-label="Downloading..."
                className="w-full"
                color="success"
                showValueLabel={true}
                size="md"
                value={(bytesDownloaded / totalSize) * 100}
              />
              <Button onPress={stopDownload} color="danger">
                중지
              </Button>
            </div>
          ) : (
            <Button onPress={startDownload}>다운로드</Button>
          )}
        </>
      ) : null}
    </div>
  )
}
