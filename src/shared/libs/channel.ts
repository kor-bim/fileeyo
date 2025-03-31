import 'server-only'
import crypto from 'crypto'
import { generateLongSlug, generateShortSlug } from '@/shared/libs/slug'
import { getRedisClient, Redis } from './redis'
import { z } from 'zod'
import { redisConfig } from '@/shared/libs/config'

export type Channel = {
  secret?: string
  longSlug: string
  shortSlug: string
  uploaderPeerID: string
}

const ChannelSchema = z.object({
  secret: z.string().optional(),
  longSlug: z.string(),
  shortSlug: z.string(),
  uploaderPeerID: z.string()
})

export interface IChannelRepo {
  createChannel(uploaderPeerID: string, ttl?: number): Promise<Channel>

  fetchChannel(slug: string): Promise<Channel | null>

  renewChannel(slug: string, secret: string, ttl?: number): Promise<boolean>

  destroyChannel(slug: string): Promise<void>
}

function getShortSlugKey(shortSlug: string): string {
  return `short:${shortSlug}`
}

function getLongSlugKey(longSlug: string): string {
  return `long:${longSlug}`
}

async function generateShortSlugUntilUnique(checkExists: (key: string) => Promise<boolean>): Promise<string> {
  for (let i = 0; i < redisConfig.shortSlug.maxAttempts; i++) {
    const slug = generateShortSlug()
    const exists = await checkExists(getShortSlugKey(slug))
    if (!exists) {
      return slug
    }
  }

  throw new Error('max attempts reached generating short slug')
}

async function generateLongSlugUntilUnique(checkExists: (key: string) => Promise<boolean>): Promise<string> {
  for (let i = 0; i < redisConfig.longSlug.maxAttempts; i++) {
    const slug = await generateLongSlug()
    const exists = await checkExists(getLongSlugKey(slug))
    if (!exists) {
      return slug
    }
  }

  throw new Error('max attempts reached generating long slug')
}

function serializeChannel(channel: Channel): string {
  return JSON.stringify(channel)
}

function deserializeChannel(str: string, scrubSecret = false): Channel {
  const parsedChannel = JSON.parse(str)
  const validatedChannel = ChannelSchema.parse(parsedChannel)
  if (scrubSecret) {
    return { ...validatedChannel, secret: undefined }
  }
  return validatedChannel
}

export class RedisChannelRepo implements IChannelRepo {
  client: Redis

  constructor() {
    this.client = getRedisClient()
  }

  async createChannel(uploaderPeerID: string, ttl: number = redisConfig.channel.ttl): Promise<Channel> {
    const shortSlug = await generateShortSlugUntilUnique(async (key) => (await this.client.get(key)) !== null)
    const longSlug = await generateLongSlugUntilUnique(async (key) => (await this.client.get(key)) !== null)

    const channel: Channel = {
      secret: crypto.randomUUID(),
      longSlug,
      shortSlug,
      uploaderPeerID
    }
    const channelStr = serializeChannel(channel)

    await this.client.setex(getLongSlugKey(longSlug), ttl, channelStr)
    await this.client.setex(getShortSlugKey(shortSlug), ttl, channelStr)

    return channel
  }

  async fetchChannel(slug: string, scrubSecret = false): Promise<Channel | null> {
    const shortChannelStr = await this.client.get(getShortSlugKey(slug))
    if (shortChannelStr) {
      return deserializeChannel(shortChannelStr, scrubSecret)
    }

    const longChannelStr = await this.client.get(getLongSlugKey(slug))
    if (longChannelStr) {
      return deserializeChannel(longChannelStr, scrubSecret)
    }

    return null
  }

  async renewChannel(slug: string, secret: string, ttl: number = redisConfig.channel.ttl): Promise<boolean> {
    const channel = await this.fetchChannel(slug)
    if (!channel || channel.secret !== secret) {
      return false
    }

    await this.client.expire(getLongSlugKey(channel.longSlug), ttl)
    await this.client.expire(getShortSlugKey(channel.shortSlug), ttl)

    return true
  }

  async destroyChannel(slug: string): Promise<void> {
    const channel = await this.fetchChannel(slug)
    if (!channel) {
      return
    }

    await this.client.del(getLongSlugKey(channel.longSlug))
    await this.client.del(getShortSlugKey(channel.shortSlug))
  }
}

let _channelRepo: IChannelRepo | null = null

export function channelRepo(): IChannelRepo {
  if (!_channelRepo) {
    _channelRepo = new RedisChannelRepo()
    console.log('[ChannelRepo] Using Redis storage')
  }
  return _channelRepo
}
