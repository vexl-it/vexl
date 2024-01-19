import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {type BasicError} from '@vexl-next/domain/src/utility/errors'
import filesystem from 'expo-file-system'
import * as TE from 'fp-ts/TaskEither'

export type RemoveFileError = BasicError<'RemoveFileError'>
export default function removeFile(
  uri: UriString
): TE.TaskEither<RemoveFileError, UriString> {
  return TE.tryCatch(
    async () => {
      await filesystem.deleteAsync(uri)
      return uri
    },
    () => ({
      _tag: 'RemoveFileError',
      error: new Error(`Could not remove file at ${uri}`),
    })
  )
}
