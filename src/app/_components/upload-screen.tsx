'use client'

import { Card, CardBody } from '@heroui/card'
import { Button } from '@heroui/react'
import { Icon } from '@iconify/react'
import { InputOtp } from '@heroui/input-otp'
import { UploadStep } from '@/shared/types'

interface Props extends UploadStep {
  onChange: (ctx: UploadStep) => void
  onNext: () => void
  onCancel: () => void
}

export const UploadScreen = ({ files, fileMetaList, password, onChange, onNext, onCancel }: Props) => {
  const removeFile = (index: number) => {
    const nextFiles = files.filter((_, i) => i !== index)
    const nextMeta = fileMetaList.filter((_, i) => i !== index)

    if (nextFiles.length === 0) {
      onCancel()
    } else {
      onChange({ files: nextFiles, fileMetaList: nextMeta, password })
    }
  }

  const handlePasswordChange = (val: string) => {
    onChange({ files, fileMetaList, password: val })
  }

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6">
      <div className="relative w-full flex flex-col items-center justify-center gap-2 box-border">
        {fileMetaList.map(({ name, type, size }, idx) => (
          <Card fullWidth key={idx}>
            <CardBody className="w-full flex flex-row items-center justify-between gap-2 overflow-hidden">
              <div className="flex flex-col gap-1 basis-2/3 overflow-hidden">
                <span className="line-clamp-1">{name}</span>
                <span className="line-clamp-1 text-xs text-default-400">{type}</span>
              </div>

              <span className="text-xs text-gray-600 basis-1/4 text-right truncate">{size}</span>
              <Button isIconOnly variant="light" color="danger" onPress={() => removeFile(idx)} className="shrink-0">
                <Icon icon="solar:minus-circle-outline" width={24} height={24} />
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>

      <InputOtp length={4} value={password} onValueChange={handlePasswordChange} />

      <div className="w-full flex items-center justify-between gap-2">
        <Button fullWidth size="lg" color="danger" className="bg-[#C4441D] h-12" onPress={onCancel}>
          취소
        </Button>
        <Button fullWidth size="lg" color="primary" className="h-12" onPress={onNext}>
          공유하기
        </Button>
      </div>
    </div>
  )
}
