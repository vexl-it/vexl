import * as FileSystem from 'expo-file-system'
import * as TE from 'fp-ts/TaskEither'
import {
  type BasicError,
  toBasicError,
} from '@vexl-next/domain/dist/utility/errors'
import {type ChatMessage} from '@vexl-next/domain/dist/general/messaging'
import {pipe} from 'fp-ts/function'
import {UriString} from '@vexl-next/domain/dist/utility/UriString.brand'
import ImageResizer from '@bam.tech/react-native-image-resizer'
import joinUrl from 'url-join'
import {Platform} from 'react-native'

export type ReadingFileError = BasicError<'ReadingFileError'>

function readAsBase64({
  path,
}: {
  path: string
}): TE.TaskEither<ReadingFileError, UriString> {
  return TE.tryCatch(async () => {
    const cacheDir = FileSystem.cacheDirectory
    if (!cacheDir) throw new Error('No cacheDir')

    const fromPath = (() => {
      if (Platform.OS === 'ios') return path
      else return path.replace('file://', '')
    })()

    const toPath = (() => {
      if (Platform.OS === 'ios') return joinUrl(cacheDir)
      else return joinUrl(cacheDir).replace('file://', '')
    })()

    const resizeResponse = await ImageResizer.createResizedImage(
      fromPath,
      512,
      512,
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

    const bytes = await FileSystem.readAsStringAsync(
      `file://${resizeResponse.path}`,
      {
        encoding: FileSystem.EncodingType.Base64,
      }
    )

    return UriString.parse(`data:image/jpeg;base64,${bytes}`)
  }, toBasicError('ReadingFileError'))
}

function setImage(source: ChatMessage): (image: UriString) => ChatMessage {
  return (image: UriString) => ({
    ...source,
    image,
  })
}

export default function replaceImageFileUriWithBase64(
  message: ChatMessage
): TE.TaskEither<ReadingFileError, ChatMessage> {
  const image = message.image
  if (!image) return TE.right(message)

  return pipe(readAsBase64({path: image}), TE.map(setImage(message)))
}
