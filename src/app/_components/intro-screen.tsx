'use client'

import { Button } from '@heroui/button'
import { UploadStep } from '@/shared/types'
import { useFileSelect } from '@/shared/hooks'

export const IntroScreen = ({ onFileSelect }: { onFileSelect: (ctx: UploadStep) => void }) => {
  const { fileInputRef, handleClick, handleFileChange } = useFileSelect(onFileSelect)

  return (
    <>
      <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileChange} />
      <Button fullWidth size="lg" variant="faded" className="h-14" onPress={handleClick}>
        👉 파일을 여기에 올리거나 클릭해서 골라보세요
      </Button>
    </>
  )
}
