'use client'

import { useDownloader } from '@/shared/hooks'
import { Card, CardBody } from '@heroui/card'
import { Button } from '@heroui/button'
import { Progress } from '@heroui/progress'
import { Spinner } from '@heroui/spinner'

export const Downloader = ({ peerId }: { peerId: string }) => {
  const {
    fileMetaList,
    isPeerReady,
    isConnected,
    isDownloading,
    isDone,
    errorMessage,
    currentFileProgress,
    startDownload,
    stopDownload
  } = useDownloader(peerId)

  const isDisconnected = isPeerReady && !isConnected && !isDownloading && !isDone && !errorMessage

  // 🕓 피어 생성 중
  if (!isPeerReady) {
    return (
      <div className="w-full flex items-center justify-center py-10 gap-2">
        <Spinner />
        <span>피어 연결 중...</span>
      </div>
    )
  }

  // 🔌 피어 연결 실패 or 중단
  if (isDisconnected) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-10 gap-4">
        <span className="text-warning font-medium">업로더와 연결이 끊어졌습니다.</span>
        <Button onPress={startDownload} color="primary">
          다시 시도
        </Button>
      </div>
    )
  }

  // ❌ 에러 메시지
  if (errorMessage) {
    return <div className="w-full text-danger text-center text-lg font-semibold py-6">{errorMessage}</div>
  }

  console.log(currentFileProgress)

  // ✅ 기본 다운로드 UI
  return (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      {fileMetaList && (
        <div className="w-full flex flex-col items-center justify-center gap-2">
          {fileMetaList.map((file, idx) => (
            <Card fullWidth key={idx}>
              <CardBody className="w-full flex flex-row items-center justify-between gap-2 overflow-hidden">
                <div className="flex flex-col gap-1 basis-2/3 overflow-hidden">
                  <span className="line-clamp-1">{file.name}</span>
                  <span className="line-clamp-1 text-xs text-default-400">{file.type}</span>
                </div>
                <span className="text-sm text-default-500 font-medium truncate">{file.size}</span>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {isDone ? (
        <div className="w-full flex flex-col gap-3 items-center">
          <Progress value={Math.round(currentFileProgress * 100)} showValueLabel color="success" className="w-full" />
          <span className="text-success font-semibold">✅ 다운로드 완료!</span>
        </div>
      ) : isDownloading ? (
        <div className="w-full flex flex-col gap-3 items-center">
          <Progress value={Math.round(currentFileProgress * 100)} showValueLabel color="success" className="w-full" />
          <Button onPress={stopDownload} color="danger" variant="solid">
            중지
          </Button>
        </div>
      ) : (
        <Button
          onPress={startDownload}
          color="primary"
          className="w-full"
          disabled={!fileMetaList || fileMetaList.length === 0}
        >
          다운로드 시작
        </Button>
      )}
    </div>
  )
}
