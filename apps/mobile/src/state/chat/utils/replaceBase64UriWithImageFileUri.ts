import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {
  toBasicError,
  type BasicError,
} from '@vexl-next/domain/src/utility/errors'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {
  hashMD5,
  type CryptoError,
} from '@vexl-next/resources-utils/src/utils/crypto'
import {Effect, Option, Schema, type Either} from 'effect'
import {Directory, File, Paths} from 'expo-file-system'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
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
type WritingFileError = BasicError<'WritingFileError'>
type BadFileName = BasicError<'BadFileName'>

function base64StringToContentAndMimeType(base64: UriString): E.Either<
  ProcessingBase64Error,
  {
    content: string
    suffix: string
  }
> {
  return E.tryCatch(() => {
    const [prefix, base64Content] = base64.split(',')
    const suffix = prefix?.match(/:image\/(.+?);/)?.at(1)

    if (!suffix || !base64Content) throw Error('Not valid base64')

    return {content: base64Content, suffix}
  }, toBasicError('ProcessingBase64Error'))
}

function documentDirectoryOrLeft(): E.Either<
  NoDocumentDirectoryError,
  UriString
> {
  const parseResult = Schema.decodeUnknownOption(UriString)(Paths.document.uri)

  if (Option.isSome(parseResult)) {
    return E.right(parseResult.value)
  }

  return E.left({
    _tag: 'NoDocumentDirectoryError',
    error: new Error(
      'Could not get document directory. FileSystem.documentDirectory is not a valid UriString'
    ),
  })
}

function createDirectoryIfItDoesNotExist(
  dir: string
): TE.TaskEither<CreatingDirectoryError, true> {
  return TE.tryCatch(async () => {
    const directory = new Directory(dir)

    if (!directory.exists) {
      directory.create({intermediates: true})
    }

    return true as const
  }, toBasicError('CreatingDirectoryError'))
}

function writeAsStringE({
  content,
  path,
}: {
  content: string
  path: string
}): Effect.Effect<Either.Either<true, WritingFileErrorE>> {
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
  }).pipe(Effect.either)
}

export type GettingImageSizeError = BasicError<'GettingImageSizeError'>

function saveBase64ImageToStorage(
  base64: UriString,
  myPublicKey: PublicKeyPemBase64,
  otherSidePublicKey: PublicKeyPemBase64
): TE.TaskEither<
  | NoDocumentDirectoryError
  | ProcessingBase64Error
  | BadFileName
  | WritingFileError
  | CreatingDirectoryError
  | CryptoError,
  UriString
> {
  return pipe(
    E.Do,
    E.bindW('documentDir', documentDirectoryOrLeft),
    E.bindW('content', () => base64StringToContentAndMimeType(base64)),
    E.bindW('fileName', ({content: {suffix}}) =>
      E.right(`${generateUuid()}.${suffix}`)
    ),
    E.bindW('chatPath', () => hashMD5(`${myPublicKey}${otherSidePublicKey}`)),
    E.bindW('directoryPath', ({documentDir, chatPath}) =>
      E.right(Paths.join(documentDir, IMAGES_DIRECTORY, chatPath))
    ),
    E.bindW('filePath', ({directoryPath, fileName}) => {
      return pipe(
        E.right(Paths.join(directoryPath, fileName)),
        E.chainW(Schema.decodeUnknownEither(UriString)),
        E.mapLeft(toBasicError('BadFileName'))
      )
    }),
    TE.fromEither,
    TE.chainFirstW(({directoryPath}) =>
      createDirectoryIfItDoesNotExist(directoryPath)
    ),
    TE.chainFirstW(({content, filePath}) =>
      effectToTaskEither(
        writeAsStringE({content: content.content, path: filePath})
      )
    ),
    TE.map((one) => one.filePath)
  )
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
): T.Task<ChatMessageWithState> {
  if (message.state === 'receivedButRequiresNewerVersion') return T.of(message)

  const image = message.message.image
  const replyToImage = message.message?.repliedTo?.image
  const tradeChecklistIdentityImage =
    message.message.tradeChecklistUpdate?.identity?.image

  return pipe(
    T.Do,
    T.bind('image', () =>
      image
        ? pipe(
            saveBase64ImageToStorage(image, inboxPublicKey, otherSidePublicKey),
            TE.match(
              (e) => {
                reportError(
                  'error',
                  new Error('Error while processing message image'),
                  {
                    e,
                  }
                )
                return undefined
              },
              (one) => one
            )
          )
        : T.of(undefined)
    ),
    T.bind('replyToImage', () =>
      replyToImage
        ? pipe(
            saveBase64ImageToStorage(
              replyToImage,
              inboxPublicKey,
              otherSidePublicKey
            ),
            TE.match(
              (e) => {
                reportError(
                  'error',
                  new Error('Error while processing message replyToImage'),
                  {e}
                )
                return undefined
              },
              (one) => one
            )
          )
        : T.of(undefined)
    ),
    T.bind('tradeChecklistIdentityImage', () =>
      tradeChecklistIdentityImage
        ? pipe(
            saveBase64ImageToStorage(
              tradeChecklistIdentityImage,
              inboxPublicKey,
              otherSidePublicKey
            ),
            TE.match(
              (e) => {
                reportError(
                  'error',
                  new Error('Error while processing message image'),
                  {
                    e,
                  }
                )
                return undefined
              },
              (one) => one
            )
          )
        : T.of(undefined)
    ),
    T.map(replaceImages(message))
  )
}
