import 'server-only'
import crypto from 'crypto'
import { config } from '@/libs/config'
import { generateLongSlug, generateShortSlug } from '@/libs/slug'

export type Channel = {
  secret?: string
  longSlug: string
  shortSlug: string
  uploaderPeerID: string
}

export interface ChannelRepo {
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
  for (let i = 0; i < config.shortSlug.maxAttempts; i++) {
    const slug = generateShortSlug()
    const exists = await checkExists(getShortSlugKey(slug))
    if (!exists) {
      return slug
    }
  }

  throw new Error('max attempts reached generating short slug')
}

async function generateLongSlugUntilUnique(checkExists: (key: string) => Promise<boolean>): Promise<string> {
  for (let i = 0; i < config.longSlug.maxAttempts; i++) {
    const slug = await generateLongSlug()
    const exists = await checkExists(getLongSlugKey(slug))
    if (!exists) {
      return slug
    }
  }

  throw new Error('max attempts reached generating long slug')
}

type MemoryStoredChannel = {
  channel: Channel
  expiresAt: number
}

export class MemoryChannelRepo implements ChannelRepo {
  private channels: Map<string, MemoryStoredChannel> = new Map()
  private timeouts: Map<string, NodeJS.Timeout> = new Map()

  private setChannelTimeout(slug: string, ttl: number) {
    // Clear any existing timeout
    const existingTimeout = this.timeouts.get(slug)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Set new timeout to remove channel when expired
    const timeout = setTimeout(() => {
      this.channels.delete(slug)
      this.timeouts.delete(slug)
    }, ttl * 1000)

    this.timeouts.set(slug, timeout)
  }

  async createChannel(uploaderPeerID: string, ttl: number = config.channel.ttl): Promise<Channel> {
    const shortSlug = await generateShortSlugUntilUnique(async (key) => this.channels.has(key))
    const longSlug = await generateLongSlugUntilUnique(async (key) => this.channels.has(key))

    const channel: Channel = {
      secret: crypto.randomUUID(),
      longSlug,
      shortSlug,
      uploaderPeerID
    }

    const expiresAt = Date.now() + ttl * 1000
    const storedChannel = { channel, expiresAt }

    const shortKey = getShortSlugKey(shortSlug)
    const longKey = getLongSlugKey(longSlug)

    this.channels.set(shortKey, storedChannel)
    this.channels.set(longKey, storedChannel)

    this.setChannelTimeout(shortKey, ttl)
    this.setChannelTimeout(longKey, ttl)

    return channel
  }

  async fetchChannel(slug: string, scrubSecret = false): Promise<Channel | null> {
    const shortKey = getShortSlugKey(slug)
    const shortChannel = this.channels.get(shortKey)
    if (shortChannel) {
      return scrubSecret ? { ...shortChannel.channel, secret: undefined } : shortChannel.channel
    }

    const longKey = getLongSlugKey(slug)
    const longChannel = this.channels.get(longKey)
    if (longChannel) {
      return scrubSecret ? { ...longChannel.channel, secret: undefined } : longChannel.channel
    }

    return null
  }

  async renewChannel(slug: string, secret: string, ttl: number = config.channel.ttl): Promise<boolean> {
    const channel = await this.fetchChannel(slug)
    if (!channel || channel.secret !== secret) {
      return false
    }

    const expiresAt = Date.now() + ttl * 1000
    const storedChannel = { channel, expiresAt }

    const shortKey = getShortSlugKey(channel.shortSlug)
    const longKey = getLongSlugKey(channel.longSlug)

    this.channels.set(longKey, storedChannel)
    this.channels.set(shortKey, storedChannel)

    this.setChannelTimeout(shortKey, ttl)
    this.setChannelTimeout(longKey, ttl)

    return true
  }

  async destroyChannel(slug: string): Promise<void> {
    const channel = await this.fetchChannel(slug)
    if (!channel) {
      return
    }

    const shortKey = getShortSlugKey(channel.shortSlug)
    const longKey = getLongSlugKey(channel.longSlug)

    // Clear timeouts
    const shortTimeout = this.timeouts.get(shortKey)
    if (shortTimeout) {
      clearTimeout(shortTimeout)
      this.timeouts.delete(shortKey)
    }

    const longTimeout = this.timeouts.get(longKey)
    if (longTimeout) {
      clearTimeout(longTimeout)
      this.timeouts.delete(longKey)
    }

    this.channels.delete(longKey)
    this.channels.delete(shortKey)
  }
}
