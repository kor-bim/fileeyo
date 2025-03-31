import crypto from 'crypto'
import { getRedisClient } from '@/shared/libs/redis'

const REALM = process.env.TURN_REALM || 'fileeyo'

function generateTurnHMACKey(username: string, password: string): string {
  const raw = `${username}:${REALM}:${password}`
  return crypto.createHash('md5').update(raw).digest('hex')
}

/**
 * Redis에 coturn 인증 키(HMAC)를 저장합니다.
 * coturn은 이 키를 사용하여 사용자 인증을 수행합니다.
 */
export async function storeTurnAuthKeyInRedis(username: string, password: string, ttl: number) {
  if (!process.env.COTURN_ENABLED) return

  const redis = getRedisClient()
  const hmacKey = generateTurnHMACKey(username, password)
  const redisKey = `turn/realm/${REALM}/user/${username}/key`

  await redis.setex(redisKey, ttl, hmacKey)
}
