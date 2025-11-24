import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {type BasicError} from '@vexl-next/domain/src/utility/errors'
import {Effect} from 'effect'
import filesystem from 'expo-file-system'

export type RemoveFileError = BasicError<'RemoveFileError'>
export default function removeFile(
  uri: UriString
): Effect.Effect<UriString, RemoveFileError> {
  return Effect.tryPromise({
    try: async () => {
      await filesystem.deleteAsync(uri)
      return uri
    },
    catch: () => ({
      _tag: 'RemoveFileError',
      error: new Error(`Could not remove file at ${uri}`),
    }),
  })
}
