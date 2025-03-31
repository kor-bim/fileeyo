import { channelRepo } from '@/shared/libs/channel'
import { notFound } from 'next/navigation'
import { Downloader } from './_components/downloader'

const normalizeSlug = (rawSlug: string | string[]): string => {
  return Array.isArray(rawSlug) ? rawSlug.join('/') : rawSlug
}

export default async function DownloadPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const channel = await channelRepo().fetchChannel(normalizeSlug(slug))

  if (!channel) {
    notFound()
  }

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <Downloader peerId={channel.uploaderPeerID} />
    </div>
  )
}
