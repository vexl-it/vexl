import ImageResizer, {type Response} from '@bam.tech/react-native-image-resizer'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Effect, Schema} from 'effect'
import {Paths} from 'expo-file-system'
import {Platform} from 'react-native'
import resolveLocalUri from './resolveLocalUri'

export class ReadingFileError extends Schema.TaggedError<ReadingFileError>(
  'ReadingFileError'
)('ReadingFileError', {
  cause: Schema.Unknown,
}) {}

function toResizerPath(uri: string): string {
  return Platform.OS === 'ios' ? uri : uri.replace('file://', '')
}

/**
 * Re-encodes the image as JPEG into the cache directory. Metadata (EXIF, GPS)
 * is not copied to the output (`keepMeta` is off).
 */
export function resizeImage({
  path,
  maxSide,
  quality,
}: {
  path: UriString
  maxSide: number
  quality: number
}): Effect.Effect<Response, ReadingFileError> {
  return Effect.tryPromise({
    try: async () =>
      await ImageResizer.createResizedImage(
        toResizerPath(resolveLocalUri(path)),
        maxSide,
        maxSide,
        'JPEG',
        quality,
        0,
        toResizerPath(Paths.cache.uri),
        false,
        {onlyScaleDown: true, mode: 'contain'}
      ),
    catch: (cause) => new ReadingFileError({cause}),
  })
}
