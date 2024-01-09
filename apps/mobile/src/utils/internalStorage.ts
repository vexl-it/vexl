import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as FileSystem from 'expo-file-system'
import {pipe} from 'fp-ts/function'
import {PathString} from '@vexl-next/domain/src/utility/PathString.brand'
import urlJoin from 'url-join'
import {safeParse} from './fpUtils'

export interface FileSystemError {
  _tag: 'fileSystemError'
  error: unknown
}
function documentDirectoryOrLeft(): E.Either<FileSystemError, string> {
  const parseResult = UriString.safeParse(FileSystem.documentDirectory)
  if (parseResult.success) {
    return E.right(parseResult.data)
  }
  return E.left({
    _tag: 'fileSystemError',
    error: new Error(
      'Could not get document directory. FileSystem.documentDirectory is not a valid UriString'
    ),
  })
}

function copyFile({
  from,
  to,
}: {
  from: UriString
  to: UriString
}): TE.TaskEither<FileSystemError, UriString> {
  return TE.tryCatch(
    async () => {
      await FileSystem.copyAsync({
        from,
        to,
      })
      return from
    },
    (e) => {
      return {
        _tag: 'fileSystemError',
        error: e,
      }
    }
  )
}

function filenameOrLeft(
  path: PathString | UriString
): E.Either<FileSystemError, PathString> {
  const splitPath = path.split('/')
  return pipe(
    splitPath.at(-1),
    E.right,
    E.chainW(safeParse(PathString)),
    E.mapLeft((e) => ({_tag: 'fileSystemError', error: e}))
  )
}

export function copyFileToNewPath({
  localDirectoryFilePath,
  sourceUri,
}: {
  localDirectoryFilePath: PathString
  sourceUri: UriString
}): TE.TaskEither<FileSystemError, UriString> {
  return pipe(
    documentDirectoryOrLeft(),
    E.map((documentDirectory) =>
      urlJoin(documentDirectory, localDirectoryFilePath)
    ),
    E.chainW(safeParse(UriString)),
    TE.fromEither,
    TE.chainW((fullPathToNewFile) =>
      copyFile({from: sourceUri, to: fullPathToNewFile})
    ),
    TE.mapLeft((e) => {
      if (e._tag === 'ParseError') {
        return {
          _tag: 'fileSystemError',
          error: e.error,
        }
      }
      return e
    })
  )
}

export function copyFileLocalDirectoryAndKeepName({
  sourceUri,
  targetFolder,
}: {
  sourceUri: UriString
  targetFolder: PathString
}): TE.TaskEither<FileSystemError, UriString> {
  return pipe(
    filenameOrLeft(sourceUri),
    E.map((fileName) => urlJoin(targetFolder, fileName)),
    E.chainW(safeParse(PathString)),
    TE.fromEither,
    TE.chainW((fullPathToNewFile) =>
      copyFileToNewPath({sourceUri, localDirectoryFilePath: fullPathToNewFile})
    ),
    TE.mapLeft((e) => {
      if (e._tag === 'ParseError') {
        return {
          _tag: 'fileSystemError',
          error: e.error,
        }
      }
      return e
    })
  )
}
