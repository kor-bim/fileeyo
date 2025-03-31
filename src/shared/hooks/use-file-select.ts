import { useRef, useState, useCallback, useMemo, ChangeEvent } from 'react'
import { UploadStep } from '@/shared/types'

export function useFileSelect(onSelect?: (ctx: UploadStep) => void) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [files, setFiles] = useState<File[]>([])

  const formatFileSize = useCallback((size: number): string => {
    if (size >= 1 << 30) return `${(size / (1 << 30)).toFixed(2)} GB`
    if (size >= 1 << 20) return `${(size / (1 << 20)).toFixed(2)} MB`
    if (size >= 1 << 10) return `${(size / (1 << 10)).toFixed(2)} KB`
    return `${size} B`
  }, [])

  const fileMetaList = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        type: file.type || 'unknown',
        size: formatFileSize(file.size)
      })),
    [files, formatFileSize]
  )

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return

      const selected = Array.from(e.target.files)
      setFiles(selected)

      if (onSelect) {
        const meta = selected.map((file) => ({
          name: file.name,
          type: file.type || 'unknown',
          size: formatFileSize(file.size)
        }))

        onSelect({
          files: selected,
          fileMetaList: meta,
          password: ''
        })
      }
    },
    [onSelect, formatFileSize]
  )

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
  }, [])

  return {
    files,
    fileMetaList,
    fileInputRef,
    handleClick,
    handleFileChange,
    removeFile,
    clearFiles
  }
}
