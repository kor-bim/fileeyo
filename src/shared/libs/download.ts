import JSZip from 'jszip'

type DownloadFileStream = {
  name: string
  size: number
  stream: () => ReadableStream<Uint8Array>
}

/**
 * 단일 파일 다운로드 (stream → blob → 링크 클릭)
 */
export async function streamDownloadSingleFile(file: DownloadFileStream, filename: string): Promise<void> {
  const reader = file.stream().getReader()
  const chunks: Uint8Array[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }

  const blob = new Blob(chunks)
  triggerBlobDownload(blob, filename)
}

/**
 * 여러 파일을 zip으로 압축하여 다운로드
 */
export async function streamDownloadMultipleFiles(files: DownloadFileStream[], zipFilename: string): Promise<void> {
  const zip = new JSZip()

  await Promise.all(
    files.map(async ({ name, stream }) => {
      const reader = stream().getReader()
      const chunks: Uint8Array[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) chunks.push(value)
      }

      const blob = new Blob(chunks)
      zip.file(name, blob)
    })
  )

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  triggerBlobDownload(zipBlob, zipFilename)
}

/**
 * Blob을 다운로드 링크로 변환 후 자동 클릭
 */
function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
