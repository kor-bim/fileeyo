import { initChannelRepo } from '@/shared/libs/channel'
import { notFound } from 'next/navigation'
import { Downloader } from './_components/downloader'

const normalizeSlug = (rawSlug: string | string[]): string => {
  return Array.isArray(rawSlug) ? rawSlug.join('/') : rawSlug
}

export default async function DownloadPage(paramsPromise: Promise<{ params: { slug: string[] } }>) {
  const { params } = await paramsPromise
  const slug = normalizeSlug(params.slug)

  console.log(slug)
  const channel = await initChannelRepo().fetchChannel(slug)

  if (!channel) {
    notFound()
  }

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">파일 다운로드</h1>
      <Downloader peerId={channel.uploaderPeerID} />
    </div>
  )
}
