import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {
  toBasicError,
  type BasicError,
} from '@vexl-next/domain/src/utility/errors'
import {
  hashMD5,
  type CryptoError,
} from '@vexl-next/resources-utils/src/utils/crypto'
import {Effect, Either, Schema} from 'effect'
import {Directory, File, Paths} from 'expo-file-system'
import {safeParse} from '../../../utils/fpUtils'
import {IMAGES_DIRECTORY} from '../../../utils/fsDirectories'
import reportError from '../../../utils/reportError'
import {type ChatMessageWithState} from '../domain'

export class WritingFileErrorE extends Schema.TaggedError<WritingFileErrorE>(
  'WritingFileErrorE'
)('WritingFileErrorE', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}

type NoDocumentDirectoryError = BasicError<'NoDocumentDirectoryError'>
type CreatingDirectoryError = BasicError<'CreatingDirectoryError'>
type ProcessingBase64Error = BasicError<'ProcessingBase64Error'>
type BadFileName = BasicError<'BadFileName'>

function base64StringToContentAndMimeType(base64: UriString): Either.Either<
  {
    content: string
    suffix: string
  },
  ProcessingBase64Error
> {
  return Either.try({
    try: () => {
      const [prefix, base64Content] = base64.split(',')
      const suffix = prefix?.match(/:image\/(.+?);/)?.at(1)

      if (!suffix || !base64Content) throw Error('Not valid base64')

      return {content: base64Content, suffix}
    },
    catch: toBasicError('ProcessingBase64Error'),
  })
}

function documentDirectoryOrLeft(): Either.Either<
  UriString,
  NoDocumentDirectoryError
> {
  const parseResult = UriString.safeParse(Paths.document.uri)

  if (parseResult.success) {
    return Either.right(parseResult.data)
  }

  return Either.left({
    _tag: 'NoDocumentDirectoryError',
    error: new Error(
      'Could not get document directory. FileSystem.documentDirectory is not a valid UriString'
    ),
  })
}

function createDirectoryIfItDoesNotExist(
  dir: string
): Effect.Effect<true, CreatingDirectoryError> {
  return Effect.tryPromise({
    try: async () => {
      const directory = new Directory(dir)

      if (!directory.exists) {
        directory.create({intermediates: true})
      }

      return true as const
    },
    catch: toBasicError('CreatingDirectoryError'),
  })
}

function writeAsStringE({
  content,
  path,
}: {
  content: string
  path: string
}): Effect.Effect<true, WritingFileErrorE> {
  return Effect.try({
    try: () => {
      const fileToWrite = new File(path)

      fileToWrite.write(content, {encoding: 'base64'})

      return true as const
    },
    catch: (e) =>
      new WritingFileErrorE({
        cause: e,
        message: 'Error while writing to file',
      }),
  })
}

export type GettingImageSizeError = BasicError<'GettingImageSizeError'>

function saveBase64ImageToStorage(
  base64: UriString,
  myPublicKey: PublicKeyPemBase64,
  otherSidePublicKey: PublicKeyPemBase64
): Effect.Effect<
  UriString,
  | NoDocumentDirectoryError
  | ProcessingBase64Error
  | BadFileName
  | WritingFileErrorE
  | CreatingDirectoryError
  | CryptoError
> {
  return Effect.gen(function* (_) {
    const documentDirEither = documentDirectoryOrLeft()
    if (Either.isLeft(documentDirEither)) {
      return yield* _(Effect.fail(documentDirEither.left))
    }
    const documentDir = documentDirEither.right

    const contentEither = base64StringToContentAndMimeType(base64)
    if (Either.isLeft(contentEither)) {
      return yield* _(Effect.fail(contentEither.left))
    }
    const content = contentEither.right

    const fileName = `${generateUuid()}.${content.suffix}`
    const chatPathFpTsEither = hashMD5(`${myPublicKey}${otherSidePublicKey}`)

    // Convert fp-ts Either to Effect Either
    const chatPath = yield* _(
      Effect.gen(function* (_) {
        if (chatPathFpTsEither._tag === 'Left') {
          return yield* _(Effect.fail(chatPathFpTsEither.left))
        }
        return chatPathFpTsEither.right
      })
    )
    const directoryPath = Paths.join(documentDir, IMAGES_DIRECTORY, chatPath)

    const filePathEither = safeParse(UriString)(
      Paths.join(directoryPath, fileName)
    )
    if (Either.isLeft(filePathEither)) {
      return yield* _(
        Effect.fail(toBasicError('BadFileName')(filePathEither.left))
      )
    }
    const filePath = filePathEither.right

    yield* _(createDirectoryIfItDoesNotExist(directoryPath))

    yield* _(writeAsStringE({content: content.content, path: filePath}))

    return filePath
  })
}

function replaceImages(
  source: ChatMessageWithState
): (args: {
  image: UriString | undefined
  replyToImage: UriString | undefined
  tradeChecklistIdentityImage: UriString | undefined
}) => ChatMessageWithState {
  return ({image, replyToImage, tradeChecklistIdentityImage}) => {
    if (source.state === 'receivedButRequiresNewerVersion') return source
    if (
      !source.message.deanonymizedUser &&
      !source.message.tradeChecklistUpdate?.identity
    )
      return source

    return {
      ...source,
      message: {
        ...source.message,
        image,
        replyTo: source.message.repliedTo
          ? {
              ...source.message.repliedTo,
              image: replyToImage,
            }
          : undefined,
        tradeChecklistUpdate: source.message.tradeChecklistUpdate?.identity
          ? {
              identity: {
                ...source.message.tradeChecklistUpdate.identity,
                image: tradeChecklistIdentityImage,
              },
            }
          : source.message.tradeChecklistUpdate,
      },
    }
  }
}

export default function replaceBase64UriWithImageFileUri(
  message: ChatMessageWithState,
  inboxPublicKey: PublicKeyPemBase64,
  otherSidePublicKey: PublicKeyPemBase64
): Effect.Effect<ChatMessageWithState> {
  if (message.state === 'receivedButRequiresNewerVersion')
    return Effect.succeed(message)

  const image = message.message.image
  const replyToImage = message.message?.repliedTo?.image
  const tradeChecklistIdentityImage =
    message.message.tradeChecklistUpdate?.identity?.image

  return Effect.gen(function* (_) {
    const imageResult = yield* _(
      image
        ? saveBase64ImageToStorage(
            image,
            inboxPublicKey,
            otherSidePublicKey
          ).pipe(
            Effect.match({
              onFailure: (e) => {
                reportError(
                  'error',
                  new Error('Error while processing message image'),
                  {
                    e,
                  }
                )
                return undefined
              },
              onSuccess: (one) => one,
            })
          )
        : Effect.succeed(undefined)
    )

    const replyToImageResult = yield* _(
      replyToImage
        ? saveBase64ImageToStorage(
            replyToImage,
            inboxPublicKey,
            otherSidePublicKey
          ).pipe(
            Effect.match({
              onFailure: (e) => {
                reportError(
                  'error',
                  new Error('Error while processing message replyToImage'),
                  {e}
                )
                return undefined
              },
              onSuccess: (one) => one,
            })
          )
        : Effect.succeed(undefined)
    )

    const tradeChecklistIdentityImageResult = yield* _(
      tradeChecklistIdentityImage
        ? saveBase64ImageToStorage(
            tradeChecklistIdentityImage,
            inboxPublicKey,
            otherSidePublicKey
          ).pipe(
            Effect.match({
              onFailure: (e) => {
                reportError(
                  'error',
                  new Error('Error while processing message image'),
                  {
                    e,
                  }
                )
                return undefined
              },
              onSuccess: (one) => one,
            })
          )
        : Effect.succeed(undefined)
    )

    return replaceImages(message)({
      image: imageResult,
      replyToImage: replyToImageResult,
      tradeChecklistIdentityImage: tradeChecklistIdentityImageResult,
    })
  })
}
