import { Card, CardBody } from '@heroui/card'
import { Button } from '@heroui/react'
import { Icon } from '@iconify/react'
import React from 'react'

interface FileUploadProps {
  props: {
    fileInputRef: React.RefObject<HTMLInputElement | null>
    handleClick: () => void
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    fileMetaList: { name: string; type: string; size: string }[]
    removeFile: (index: number) => void
    clearFiles: () => void
    handleShare: () => void
  }
}

export const FileUpload = ({ props }: FileUploadProps) => {
  const { fileInputRef, handleClick, handleFileChange, fileMetaList, removeFile, clearFiles, handleShare } = props
  return (
    <>
      {fileMetaList.length > 0 ? (
        <>
          <div className="relative w-full flex flex-col items-center justify-center gap-2 box-border">
            {fileMetaList.map(({ name, type, size }, idx) => (
              <Card fullWidth key={idx}>
                <CardBody className="w-full flex flex-row items-center justify-between gap-2 overflow-hidden">
                  <div className="flex flex-col gap-1 basis-2/3 overflow-hidden">
                    <span className="line-clamp-1">{name}</span>
                    <span className="line-clamp-1 text-xs text-default-400">{type}</span>
                  </div>

                  <span className="text-xs text-gray-600 basis-1/4 text-right truncate">{size}</span>
                  <Button
                    isIconOnly
                    variant="light"
                    color="danger"
                    onPress={() => removeFile(idx)}
                    className="shrink-0"
                  >
                    <Icon icon="solar:minus-circle-outline" width={24} height={24} />
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
          <div className="w-full flex items-center justify-between gap-2">
            <Button fullWidth size="lg" color="danger" className="bg-[#C4441D] h-12" onPress={clearFiles}>
              취소
            </Button>
            <Button fullWidth size="lg" color="primary" className="h-12" onPress={handleShare}>
              공유하기
            </Button>
          </div>
        </>
      ) : (
        <div className="w-full flex flex-col items-center justify-center gap-4">
          <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileChange} />
          <Button fullWidth size="lg" variant="faded" className="h-14" onPress={handleClick}>
            👉 파일을 여기에 올리거나 클릭해서 골라보세요
          </Button>
        </div>
      )}
    </>
  )
}
