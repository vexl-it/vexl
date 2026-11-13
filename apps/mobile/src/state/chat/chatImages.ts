import {
  aesGCMDecryptBytes,
  aesGCMEncryptBytes,
  generateAesKey,
} from '@vexl-next/cryptography/src/operations/aes'
import {
  type Chat,
  ChatImageAttachment,
  type ChatImageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {CHAT_IMAGE_CONTENT_TYPE} from '@vexl-next/rest-api/src/services/chat/contracts'
import {Array, Effect, type Exit, Option, pipe, Predicate, Schema} from 'effect'
import {File} from 'expo-file-system'
import {fetch, type FetchRequestInit} from 'expo/fetch'
import {atom} from 'jotai'
import {apiAtom, apiEnv} from '../../api'
import {type ChatKeys, getChatImagesDirectory} from '../../utils/fsDirectories'
import reportError from '../../utils/reportError'
import {ReadingFileError, resizeImage} from '../../utils/resizeImage'
import {type ChatMessageWithState} from './domain'

const CHAT_IMAGE_MAX_SIDE = 1920
const CHAT_IMAGE_QUALITY = 80

const MINIMAL_VERSION_FOR_CHAT_IMAGES =
  Schema.decodeSync(VersionString)('26.11.1')

export class ChatImageProcessingError extends Schema.TaggedError<ChatImageProcessingError>(
  'ChatImageProcessingError'
)('ChatImageProcessingError', {
  cause: Schema.Unknown,
}) {}

/** Network failure or S3 refusal, e.g. 403/404 once the image expired. */
export class ChatImageTransferError extends Schema.TaggedError<ChatImageTransferError>(
  'ChatImageTransferError'
)('ChatImageTransferError', {
  cause: Schema.Unknown,
  status: Schema.optional(Schema.Number),
}) {}

// S3 answers a missing key with 403 as nobody may list the bucket.
export function isChatImageGone(error: ChatImageDownloadError): boolean {
  return (
    error._tag === 'ChatImageTransferError' &&
    (error.status === 403 || error.status === 404)
  )
}

type UploadChatImageApiError = Effect.Effect.Error<
  ReturnType<ChatApi['requestChatImageUpload']>
>

// S3 requests carry no Vexl headers and no cookies.
function fetchFromS3(
  url: string,
  init?: FetchRequestInit
): Effect.Effect<Uint8Array, ChatImageTransferError> {
  return Effect.tryPromise({
    try: async (signal) => {
      const response = await fetch(url, {
        ...init,
        credentials: 'omit',
        signal,
      })
      if (!response.ok)
        throw new ChatImageTransferError({
          cause: new Error(`S3 responded ${response.status}`),
          status: response.status,
        })
      return await response.bytes()
    },
    catch: (cause) =>
      cause instanceof ChatImageTransferError
        ? cause
        : new ChatImageTransferError({cause}),
  })
}

export function getChatKeys(chat: Chat): ChatKeys {
  return {
    inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
    otherSideKey: chat.otherSide.publicKey,
  }
}

function getChatImageFile(
  id: ChatImageId,
  chatKeys: ChatKeys
): Option.Option<File> {
  return Option.map(
    getChatImagesDirectory(chatKeys),
    (directory) => new File(directory, `${id}.jpg`)
  )
}

export function getDownloadedChatImageUri(
  id: ChatImageId,
  chatKeys: ChatKeys
): Option.Option<UriString> {
  return pipe(
    getChatImageFile(id, chatKeys),
    Option.filter((file) => file.exists),
    Option.flatMap((file) => Schema.decodeUnknownOption(UriString)(file.uri))
  )
}

let transfersGeneration = 0
const chatTransfersGenerations = new Map<string, number>()

function chatTransfersKey({inboxKey, otherSideKey}: ChatKeys): string {
  return `${inboxKey}${otherSideKey}`
}

/** Tells whether the chat's transfers were cancelled since this call. */
function cancelledSince(chatKeys: ChatKeys): () => boolean {
  const key = chatTransfersKey(chatKeys)
  const generation = transfersGeneration
  const chatGeneration = chatTransfersGenerations.get(key)
  return () =>
    generation !== transfersGeneration ||
    chatGeneration !== chatTransfersGenerations.get(key)
}

function writeChatImageFile({
  id,
  chatKeys,
  isCancelled,
  write,
}: {
  id: ChatImageId
  chatKeys: ChatKeys
  isCancelled: () => boolean
  write: (file: File) => void
}): Effect.Effect<UriString, ChatImageProcessingError> {
  return Effect.try({
    // Checked in the same synchronous step as the write, so a cancellation
    // cannot slip in between.
    try: () => {
      if (isCancelled()) return Option.none()
      const file = Option.getOrThrow(getChatImageFile(id, chatKeys))
      file.parentDirectory.create({intermediates: true, idempotent: true})
      write(file)
      return Option.some(Schema.decodeSync(UriString)(file.uri))
    },
    catch: (cause) => new ChatImageProcessingError({cause}),
  }).pipe(
    Effect.flatMap(
      Option.match({onNone: () => Effect.interrupt, onSome: Effect.succeed})
    )
  )
}

function decryptChatImage(
  data: Uint8Array,
  key: string
): Effect.Effect<Uint8Array, ChatImageProcessingError> {
  return Effect.try({
    // expo-file-system on iOS crashes on Buffer, it needs a plain Uint8Array.
    try: () =>
      new Uint8Array(
        aesGCMDecryptBytes({data, key: Buffer.from(key, 'base64')})
      ),
    catch: (cause) => new ChatImageProcessingError({cause}),
  })
}

type ChatImageDownloadError = ChatImageTransferError | ChatImageProcessingError
type ChatImageDownload = Promise<Exit.Exit<UriString, ChatImageDownloadError>>
const inFlightDownloads = new Map<ChatImageId, ChatImageDownload>()

/**
 * Stops pending uploads and downloads from writing files, e.g. before logout
 * wipes them.
 */
export function cancelChatImageTransfers(): void {
  transfersGeneration += 1
  inFlightDownloads.clear()
}

function startDownload({
  attachment,
  chatKeys,
}: {
  attachment: ChatImageAttachment
  chatKeys: ChatKeys
}): ChatImageDownload {
  const isCancelled = cancelledSince(chatKeys)
  const download = fetchFromS3(`${apiEnv.chatImagesUrl}/${attachment.id}`).pipe(
    Effect.flatMap((data) => decryptChatImage(data, attachment.key)),
    Effect.flatMap((bytes) =>
      writeChatImageFile({
        id: attachment.id,
        chatKeys,
        isCancelled,
        write: (file) => {
          // Write next to the target first so an interrupted write never
          // leaves a broken file that counts as downloaded.
          const partialFile = new File(`${file.uri}.part`)
          partialFile.write(bytes)
          partialFile.moveSync(file)
        },
      })
    ),
    Effect.runPromiseExit
  )
  inFlightDownloads.set(attachment.id, download)
  void download.finally(() => inFlightDownloads.delete(attachment.id))
  return download
}

/**
 * Resolves the local file of the attachment, downloading and decrypting it
 * when it is not stored yet. Concurrent calls share one download.
 */
export const ensureChatImageDownloadedActionAtom = atom(
  null,
  (
    _get,
    _set,
    {
      attachment,
      chatKeys,
    }: {attachment: ChatImageAttachment; chatKeys: ChatKeys}
  ): Effect.Effect<UriString, ChatImageDownloadError> =>
    Effect.suspend(() =>
      Option.match(getDownloadedChatImageUri(attachment.id, chatKeys), {
        onSome: Effect.succeed,
        onNone: () => {
          const download =
            inFlightDownloads.get(attachment.id) ??
            startDownload({attachment, chatKeys})
          return Effect.flatten(Effect.promise(() => download))
        },
      })
    )
)

export const downloadNewChatImagesActionAtom = atom(
  null,
  (
    _get,
    set,
    {
      messages,
      inboxKey,
    }: {
      messages: readonly ChatMessageWithState[]
      inboxKey: ChatKeys['inboxKey']
    }
  ): void => {
    pipe(
      messages,
      Array.filterMap(({message}) =>
        Option.map(
          Option.fromNullable(message.imageAttachment),
          (attachment) => {
            const chatKeys = {inboxKey, otherSideKey: message.senderPublicKey}
            return {attachment, chatKeys, isCancelled: cancelledSince(chatKeys)}
          }
        )
      ),
      Effect.forEach(
        ({isCancelled, ...args}) =>
          Effect.suspend(() =>
            isCancelled()
              ? Effect.void
              : set(ensureChatImageDownloadedActionAtom, args)
          ).pipe(
            Effect.tapErrorTag('ChatImageProcessingError', (e) =>
              Effect.sync(() => {
                reportError(
                  'error',
                  new Error('Error while processing downloaded chat image'),
                  {e}
                )
              })
            ),
            // Unlike Effect.ignore, also keeps a cancelled download's
            // interruption from stopping downloads of other chats.
            Effect.exit
          ),
        {concurrency: 3, discard: true}
      ),
      Effect.runFork
    )
  }
)

export const uploadChatImageIfAnyActionAtom = atom(
  null,
  (
    get,
    _set,
    {message, chat}: {message: ChatMessage; chat: Chat}
  ): Effect.Effect<
    ChatMessage,
    | ReadingFileError
    | ChatImageProcessingError
    | ChatImageTransferError
    | UploadChatImageApiError
  > => {
    const {image} = message
    if (message.messageType !== 'MESSAGE' || !image || message.imageAttachment)
      return Effect.succeed(message)

    const chatKeys = getChatKeys(chat)
    const isCancelled = cancelledSince(chatKeys)
    return Effect.gen(function* (_) {
      const resized = yield* _(
        resizeImage({
          path: image,
          maxSide: CHAT_IMAGE_MAX_SIDE,
          quality: CHAT_IMAGE_QUALITY,
        })
      )
      const resizedFile = new File(resized.uri)
      const key = generateAesKey()
      const encrypted = yield* _(
        Effect.tryPromise({
          try: async () =>
            aesGCMEncryptBytes({data: await resizedFile.bytes(), key}),
          catch: (cause) => new ReadingFileError({cause}),
        })
      )

      const {imageId, uploadUrl} = yield* _(
        get(apiAtom).chat.requestChatImageUpload({
          keyPair: chat.inbox.privateKey,
          senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
          size: encrypted.byteLength,
        })
      )
      yield* _(
        fetchFromS3(uploadUrl, {
          method: 'PUT',
          body: new Uint8Array(encrypted),
          headers: {'Content-Type': CHAT_IMAGE_CONTENT_TYPE},
        })
      )

      const imageAttachment = yield* _(
        Schema.decodeUnknown(ChatImageAttachment)({
          id: imageId,
          key: key.toString('base64'),
          width: Math.round(resized.width),
          height: Math.round(resized.height),
        }),
        Effect.mapError((cause) => new ChatImageProcessingError({cause}))
      )

      yield* _(
        writeChatImageFile({
          id: imageId,
          chatKeys,
          isCancelled,
          write: (file) => {
            resizedFile.moveSync(file)
          },
        })
      )

      return {
        ...message,
        image: undefined,
        imageAttachment,
        minimalRequiredVersion: MINIMAL_VERSION_FOR_CHAT_IMAGES,
      }
    })
  }
)

function deleteFileIfExists(file: File): void {
  try {
    if (file.exists) file.delete()
  } catch (e) {
    reportError('warn', new Error('Error while deleting chat image'), {e})
  }
}

export function deleteChatImageFiles({
  messages,
  chatKeys,
}: {
  messages: ReadonlyArray<{
    message: Pick<ChatMessage, 'imageAttachment' | 'repliedTo'>
  }>
  chatKeys: ChatKeys
}): void {
  const key = chatTransfersKey(chatKeys)
  chatTransfersGenerations.set(
    key,
    (chatTransfersGenerations.get(key) ?? 0) + 1
  )

  pipe(
    messages,
    Array.flatMap(({message}) => [
      message.imageAttachment,
      message.repliedTo?.imageAttachment,
    ]),
    Array.filter(Predicate.isNotNullable),
    Array.forEach(({id}) => {
      Option.map(getChatImageFile(id, chatKeys), (file) => {
        deleteFileIfExists(file)
        deleteFileIfExists(new File(`${file.uri}.part`))
      })
    })
  )
}
