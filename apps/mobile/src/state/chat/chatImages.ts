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
import {Array, Effect, type Exit, Option, pipe, Schema} from 'effect'
import {File} from 'expo-file-system'
import {atom} from 'jotai'
import {apiAtom} from '../../api'
import {type ChatKeys, getChatImagesDirectory} from '../../utils/fsDirectories'
import reportError from '../../utils/reportError'
import {ReadingFileError, resizeImage} from '../../utils/resizeImage'
import {type ChatMessageWithState} from './domain'

const CHAT_IMAGE_MAX_SIDE = 1920
const CHAT_IMAGE_QUALITY = 80

const MINIMAL_VERSION_FOR_CHAT_IMAGES =
  Schema.decodeSync(VersionString)('26.11.0')

export class ChatImageProcessingError extends Schema.TaggedError<ChatImageProcessingError>(
  'ChatImageProcessingError'
)('ChatImageProcessingError', {
  cause: Schema.Unknown,
}) {}

type DownloadChatImageApiError = Effect.Effect.Error<
  ReturnType<ChatApi['downloadChatImage']>
>
type UploadChatImageApiError = Effect.Effect.Error<
  ReturnType<ChatApi['uploadChatImage']>
>

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

function writeChatImageFile({
  id,
  chatKeys,
  write,
}: {
  id: ChatImageId
  chatKeys: ChatKeys
  write: (file: File) => void
}): Effect.Effect<UriString, ChatImageProcessingError> {
  return Effect.try({
    try: () => {
      const file = Option.getOrThrow(getChatImageFile(id, chatKeys))
      file.parentDirectory.create({intermediates: true, idempotent: true})
      write(file)
      return Schema.decodeSync(UriString)(file.uri)
    },
    catch: (cause) => new ChatImageProcessingError({cause}),
  })
}

function decryptChatImage(
  data: string,
  key: string
): Effect.Effect<Uint8Array, ChatImageProcessingError> {
  return Effect.try({
    try: () =>
      aesGCMDecryptBytes({
        data: Buffer.from(data, 'base64'),
        key: Buffer.from(key, 'base64'),
      }),
    catch: (cause) => new ChatImageProcessingError({cause}),
  })
}

type ChatImageDownload = Promise<
  Exit.Exit<UriString, DownloadChatImageApiError | ChatImageProcessingError>
>
const inFlightDownloads = new Map<ChatImageId, ChatImageDownload>()

function startDownload({
  api,
  attachment,
  chatKeys,
}: {
  api: ChatApi
  attachment: ChatImageAttachment
  chatKeys: ChatKeys
}): ChatImageDownload {
  const download = api.downloadChatImage({imageId: attachment.id}).pipe(
    Effect.flatMap(({data}) => decryptChatImage(data, attachment.key)),
    Effect.flatMap((bytes) =>
      writeChatImageFile({
        id: attachment.id,
        chatKeys,
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
    get,
    _set,
    {
      attachment,
      chatKeys,
    }: {attachment: ChatImageAttachment; chatKeys: ChatKeys}
  ): Effect.Effect<
    UriString,
    DownloadChatImageApiError | ChatImageProcessingError
  > =>
    Effect.suspend(() =>
      Option.match(getDownloadedChatImageUri(attachment.id, chatKeys), {
        onSome: Effect.succeed,
        onNone: () => {
          const download =
            inFlightDownloads.get(attachment.id) ??
            startDownload({api: get(apiAtom).chat, attachment, chatKeys})
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
          (attachment) => ({
            attachment,
            chatKeys: {inboxKey, otherSideKey: message.senderPublicKey},
          })
        )
      ),
      Effect.forEach(
        (args) =>
          set(ensureChatImageDownloadedActionAtom, args).pipe(
            Effect.tapErrorTag('ChatImageProcessingError', (e) =>
              Effect.sync(() => {
                reportError(
                  'error',
                  new Error('Error while processing downloaded chat image'),
                  {e}
                )
              })
            ),
            Effect.ignore
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
    ReadingFileError | ChatImageProcessingError | UploadChatImageApiError
  > => {
    const {image} = message
    if (message.messageType !== 'MESSAGE' || !image || message.imageAttachment)
      return Effect.succeed(message)

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

      const {imageId} = yield* _(
        get(apiAtom).chat.uploadChatImage({
          keyPair: chat.inbox.privateKey,
          senderPublicKey: chat.inbox.privateKey.publicKeyPemBase64,
          data: encrypted.toString('base64'),
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
          chatKeys: getChatKeys(chat),
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
  messages: ReadonlyArray<{message: Pick<ChatMessage, 'imageAttachment'>}>
  chatKeys: ChatKeys
}): void {
  pipe(
    messages,
    Array.filterMap(({message}) =>
      Option.fromNullable(message.imageAttachment)
    ),
    Array.forEach(({id}) => {
      Option.map(getChatImageFile(id, chatKeys), (file) => {
        deleteFileIfExists(file)
        void inFlightDownloads.get(id)?.finally(() => {
          deleteFileIfExists(file)
        })
      })
    })
  )
}
