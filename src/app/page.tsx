'use client'

import { FileUpload, Share } from './_components'
import { useFileSelect } from '@/shared/hooks'
import { useCallback, useState } from 'react'

export default function Home() {
  const [startShare, setStartShare] = useState<boolean>(false)
  const { files, fileInputRef, handleClick, handleFileChange, fileMetaList, removeFile, clearFiles } = useFileSelect()

  const handleShare = useCallback(() => {
    setStartShare(true)
  }, [])

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
      {!startShare ? (
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
            clearFiles
          }}
        />
      )}
      <span className="text-sm dark:text-[#A8A29E] text-[#57534E]">
        파일을 선택하면 이용약관에 동의하는 걸로 간주돼요 :)
      </span>
    </div>
  )
}
