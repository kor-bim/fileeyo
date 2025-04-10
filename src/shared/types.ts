import type { DataConnection } from 'peerjs'
import { z } from 'zod'

export type Intro = object
export type UploadStep = {
  files: File[]
  fileMetaList: { name: string; size: string; type: string }[]
  password?: string
}
export type ShareStep = Required<UploadStep>

export type UploadedFile = File & { entryFullPath?: string }

export enum UploaderConnectionStatus {
  Pending = 'PENDING',
  Ready = 'READY',
  Paused = 'PAUSED',
  Uploading = 'UPLOADING',
  Done = 'DONE',
  Authenticating = 'AUTHENTICATING',
  InvalidPassword = 'INVALID_PASSWORD',
  Closed = 'CLOSED'
}

export type UploaderConnection = {
  status: UploaderConnectionStatus
  dataConnection: DataConnection
  browserName?: string
  browserVersion?: string
  osName?: string
  osVersion?: string
  mobileVendor?: string
  mobileModel?: string
  uploadingFileName?: string
  uploadingOffset?: number
  completedFiles: number
  totalFiles: number
  currentFileProgress: number
}

export enum MessageType {
  RequestInfo = 'RequestInfo',
  Info = 'Info',
  Start = 'Start',
  Chunk = 'Chunk',
  Pause = 'Pause',
  Done = 'Done',
  Error = 'Error',
  PasswordRequired = 'PasswordRequired',
  UsePassword = 'UsePassword',
  Report = 'Report'
}

export const RequestInfoMessage = z.object({
  type: z.literal(MessageType.RequestInfo),
  browserName: z.string(),
  browserVersion: z.string(),
  osName: z.string(),
  osVersion: z.string(),
  mobileVendor: z.string(),
  mobileModel: z.string()
})

export const InfoMessage = z.object({
  type: z.literal(MessageType.Info),
  files: z.array(
    z.object({
      name: z.string(),
      size: z.number(),
      type: z.string()
    })
  ),
  fileMetaList: z
    .array(
      z.object({
        name: z.string(),
        size: z.string(), // 사람이 읽는 용도라면 string, 아니라면 number
        type: z.string()
      })
    )
    .optional()
})

export const StartMessage = z.object({
  type: z.literal(MessageType.Start),
  fileName: z.string(),
  offset: z.number()
})

export const ChunkMessage = z.object({
  type: z.literal(MessageType.Chunk),
  fileName: z.string(),
  offset: z.number(),
  bytes: z.unknown(),
  final: z.boolean()
})

export const DoneMessage = z.object({
  type: z.literal(MessageType.Done)
})

export const ErrorMessage = z.object({
  type: z.literal(MessageType.Error),
  error: z.string()
})

export const PasswordRequiredMessage = z.object({
  type: z.literal(MessageType.PasswordRequired),
  errorMessage: z.string().optional()
})

export const UsePasswordMessage = z.object({
  type: z.literal(MessageType.UsePassword),
  password: z.string()
})

export const PauseMessage = z.object({
  type: z.literal(MessageType.Pause)
})

export const ReportMessage = z.object({
  type: z.literal(MessageType.Report)
})

export const Message = z.discriminatedUnion('type', [
  RequestInfoMessage,
  InfoMessage,
  StartMessage,
  ChunkMessage,
  DoneMessage,
  ErrorMessage,
  PasswordRequiredMessage,
  UsePasswordMessage,
  PauseMessage,
  ReportMessage
])

export type Message = z.infer<typeof Message>

export function decodeMessage(data: unknown): Message {
  return Message.parse(data)
}
