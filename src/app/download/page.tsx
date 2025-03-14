// app/download.tsx
'use client'

import React from 'react'
import { Button } from '@heroui/button'
import { Card, CardBody } from '@heroui/card'
import { usePeerDownload, FileMeta } from '@/shared/hooks/use-peer-download'

export default function DownloadPage() {
  const { isConnected, filesMeta, progress, startDownload, downloadedFiles } = usePeerDownload()

  if (!isConnected) {
    return <div className="text-gray-500">연결 중...</div>
  }

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">파일 다운로드</h1>
      {filesMeta ? (
        <Card>
          <CardBody>
            <div>
              {filesMeta.map((meta: FileMeta, idx: number) => (
                <div key={idx} className="mb-2">
                  <div className="font-bold">{meta.name}</div>
                  <div className="text-sm text-gray-500">
                    {meta.type} - {meta.size} bytes
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div>전체 다운로드 진행률: {Math.round(progress)}%</div>
              {downloadedFiles.every((f) => f !== null) ? (
                <div className="mt-2 text-green-500 font-bold">모든 파일 다운로드 완료 및 ZIP 저장됨</div>
              ) : (
                <Button onPress={startDownload}>다운로드 시작</Button>
              )}
            </div>
          </CardBody>
        </Card>
      ) : (
        <Button onPress={startDownload}>다운로드 시작</Button>
      )}
    </div>
  )
}
