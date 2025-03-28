import { UploadedFile } from '@/shared/types'
import React from 'react'

type Entry = FileSystemEntry & { fullPath?: string }
type FileEntry = FileSystemFileEntry & Entry
type DirEntry = FileSystemDirectoryEntry & Entry

const getFile = (entry: FileEntry): Promise<File> =>
  new Promise((resolve, reject) => {
    entry.file((file) => {
      // @ts-expect-error - inject custom path
      file.entryFullPath = entry.fullPath
      resolve(file)
    }, reject)
  })

const readAllEntries = (reader: FileSystemDirectoryReader): Promise<Entry[]> =>
  new Promise((resolve, reject) => reader.readEntries(resolve, reject))

const scanDirectory = async (dir: DirEntry): Promise<File[]> => {
  const reader = dir.createReader()
  const files: File[] = []

  while (true) {
    const entries = await readAllEntries(reader)
    if (!entries.length) break

    const tasks = entries.map(async (entry) => {
      if (entry.isDirectory) {
        return scanDirectory(entry as DirEntry)
      } else {
        return [await getFile(entry as FileEntry)]
      }
    })

    const results = await Promise.all(tasks)
    files.push(...results.flat())
  }

  return files
}

export const extractFileList = async (e: React.DragEvent | DragEvent): Promise<File[]> => {
  const items = e.dataTransfer?.items
  if (!items?.length) return []

  const tasks = Array.from(items).map((item) => {
    const entry = item.webkitGetAsEntry?.() as Entry
    if (!entry) return []
    return entry.isDirectory ? scanDirectory(entry as DirEntry) : getFile(entry as FileEntry).then((f) => [f])
  })

  const results = await Promise.all(tasks)
  return results.flat()
}

export const formatSize = (bytes: number): string => {
  if (!bytes) return '0 Bytes'
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(1000))
  return `${(bytes / 1000 ** i).toPrecision(3)} ${units[i]}`
}

export const getFileName = (file: UploadedFile): string => file.name ?? file.entryFullPath ?? ''
