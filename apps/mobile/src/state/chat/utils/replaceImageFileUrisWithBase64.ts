import ImageResizer from '@bam.tech/react-native-image-resizer'
import {type ChatMessage} from '@vexl-next/domain/src/general/messaging'
import {type IdentityRevealChatMessage} from '@vexl-next/domain/src/general/tradeChecklist'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {
  toBasicError,
  type BasicError,
} from '@vexl-next/domain/src/utility/errors'
import {Effect} from 'effect'
import * as FileSystem from 'expo-file-system'
import {Platform} from 'react-native'
import joinUrl from 'url-join'
import reportError from '../../../utils/reportError'
import resolveLocalUri from '../../../utils/resolveLocalUri'

export type ReadingFileError = BasicError<'ReadingFileError'>

function readAsBase64({
  path,
  imageWidthOrHeightLimit,
}: {
  imageWidthOrHeightLimit: number
  path: UriString
}): Effect.Effect<UriString, ReadingFileError> {
  return Effect.tryPromise({
    try: async () => {
      const cacheDir = FileSystem.Paths.cache
      if (!cacheDir) throw new Error('No cacheDir')

      const fromPath = (() => {
        if (Platform.OS === 'ios') return resolveLocalUri(path)
        else return path.replace('file://', '')
      })()

      const toPath = (() => {
        if (Platform.OS === 'ios') return joinUrl(cacheDir.uri)
        else return joinUrl(cacheDir.uri).replace('file://', '')
      })()

      const resizeResponse = await ImageResizer.createResizedImage(
        fromPath,
        imageWidthOrHeightLimit,
        imageWidthOrHeightLimit,
        'JPEG',
        85,
        0,
        toPath,
        false,
        {
          onlyScaleDown: true,
          mode: 'contain',
        }
      )

      const bytes = new FileSystem.File(
        `file://${resizeResponse.path}`
      ).base64Sync()
      return UriString.parse(`data:image/jpeg;base64,${bytes}`)
    },
    catch: toBasicError('ReadingFileError'),
  })
}

function setImage(
  source: ChatMessage
): (args: {
  image: UriString | undefined
  replyToImage: UriString | undefined
}) => ChatMessage {
  return ({image, replyToImage}) => ({
    ...source,
    image,
    repliedTo: source.repliedTo
      ? {
          ...source.repliedTo,
          image: replyToImage,
        }
      : undefined,
  })
}

export default function replaceImageFileUrisWithBase64(
  message: ChatMessage
): Effect.Effect<ChatMessage> {
  const image = message.image
  const replyImage = message.repliedTo?.image

  return Effect.gen(function* (_) {
    const imageResult = yield* _(
      image
        ? readAsBase64({path: image, imageWidthOrHeightLimit: 512}).pipe(
            Effect.match({
              onFailure: (e) => {
                reportError(
                  'error',
                  new Error('Error while reading image as file as base64'),
                  {e}
                )
                return undefined
              },
              onSuccess: (v) => v,
            })
          )
        : Effect.succeed(undefined)
    )

    const replyToImageResult = yield* _(
      replyImage
        ? readAsBase64({path: replyImage, imageWidthOrHeightLimit: 256}).pipe(
            Effect.match({
              onFailure: (e) => {
                reportError(
                  'error',
                  new Error(
                    'Error while reading replyToImage as file as base64'
                  ),
                  {e}
                )
                return undefined
              },
              onSuccess: (v) => v,
            })
          )
        : Effect.succeed(undefined)
    )

    return setImage(message)({
      image: imageResult,
      replyToImage: replyToImageResult,
    })
  })
}

export function replaceIdentityImageFileUriWithBase64(
  identityRevealChatMessage: IdentityRevealChatMessage | undefined
): Effect.Effect<IdentityRevealChatMessage | undefined> {
  const image = identityRevealChatMessage?.image

  if (!image) return Effect.succeed(identityRevealChatMessage)

  return readAsBase64({path: image, imageWidthOrHeightLimit: 512}).pipe(
    Effect.match({
      onFailure: (e) => {
        reportError(
          'error',
          new Error('Error while reading image as file as base64'),
          {e}
        )
        return identityRevealChatMessage
      },
      onSuccess: (image) => ({
        ...identityRevealChatMessage,
        image,
      }),
    })
  )
}
