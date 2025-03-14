'use client'

import { FileUpload, Share } from './_components'
import { useFileSelect } from '@/shared/hooks'
import { usePeerConnection } from '@/shared/hooks/use-peer-connection'

export default function Home() {
  const { files, fileInputRef, handleClick, handleFileChange, fileMetaList, removeFile, clearFiles } = useFileSelect()
  const { shareUrl, initiatePeer, connectedClients, stopUpload } = usePeerConnection()

  const handleShare = () => {
    // 업로더 역할로 피어 연결을 초기화 → 공유 URL 생성
    initiatePeer({ files, fileMetaList })
  }

  return (
    <div className="w-full max-w-xl flex flex-col items-center justify-center gap-8 mt-3 px-4">
      <div className="w-full flex flex-col items-center justify-center">
        <span className="sm:text-xl">
          <strong className="text-[#C4441D] font-bold">파일</strong> 좀 보내볼까요?
        </span>
        <span className="sm:text-xl">
          <strong className="text-[#C4441D] font-bold">설치 없이</strong> 브라우저만 있으면 바로 전송할 수 있어요.
        </span>
      </div>
      {!shareUrl ? (
        <FileUpload
          props={{
            fileInputRef,
            handleClick,
            handleFileChange,
            fileMetaList,
            removeFile,
            clearFiles,
            handleShare
          }}
        />
      ) : (
        <Share
          props={{
            files,
            fileMetaList,
            shareUrl,
            connectedClients,
            stopUpload
          }}
        />
      )}
      <span className="text-sm dark:text-[#A8A29E] text-[#57534E]">
        파일을 선택하면 이용약관에 동의하는 걸로 간주돼요 :)
      </span>
    </div>
  )
}
