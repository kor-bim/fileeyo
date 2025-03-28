import { NextRequest, NextResponse } from 'next/server'
import { initChannelRepo } from '@/shared/libs/channel'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { slug } = await request.json()

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
  }

  try {
    await initChannelRepo().destroyChannel(slug)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to destroy channel' }, { status: 500 })
  }
}
