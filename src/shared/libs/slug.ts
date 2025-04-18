import 'server-only'
import crypto from 'crypto'
import { redisConfig } from '@/shared/libs/config'

/**
 * Generates an array of random words from a given word list.
 *
 * @param wordList - An array of words to choose from.
 * @param numWords - The number of words to generate.
 * @returns A Promise that resolves to an array of randomly selected words.
 */
function generateRandomWords(wordList: string[], numWords: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(wordList) || wordList.length === 0) {
      reject(new Error('Word list must be a non-empty array'))
      return
    }

    if (numWords <= 0) {
      reject(new Error('Number of words must be greater than zero'))
      return
    }

    const getRandomInt = (max: number): number => {
      const buffer = new Uint32Array(1)
      if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(buffer)
      } else {
        crypto.randomFillSync(buffer)
      }
      return buffer[0] % max
    }

    const result: string[] = []
    for (let i = 0; i < numWords; i++) {
      const randomIndex = getRandomInt(wordList.length)
      result.push(wordList[randomIndex])
    }

    resolve(result)
  })
}

export const generateShortSlug = (): string => {
  let result = ''
  for (let i = 0; i < redisConfig.shortSlug.numChars; i++) {
    result += redisConfig.shortSlug.chars[Math.floor(Math.random() * redisConfig.shortSlug.chars.length)]
  }
  return result
}

export const generateLongSlug = async (): Promise<string> => {
  const parts = await generateRandomWords(redisConfig.longSlug.words, redisConfig.longSlug.numWords)
  return parts.join('/')
}
