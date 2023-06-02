import filesystem from 'expo-file-system'
import * as TE from 'fp-ts/TaskEither'
import {type UriString} from '@vexl-next/domain/dist/utility/UriString.brand'
import {type BasicError} from '@vexl-next/domain/dist/utility/errors'

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
