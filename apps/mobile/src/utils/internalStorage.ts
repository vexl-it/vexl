import {PathString} from '@vexl-next/domain/src/utility/PathString.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect} from 'effect'
import * as FileSystem from 'expo-file-system'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import urlJoin from 'url-join'
import {safeParse} from './fpUtils'

export interface FileSystemError {
  _tag: 'fileSystemError'
  error: unknown
}
function documentDirectoryOrLeft(): E.Either<FileSystemError, string> {
  const parseResult = UriString.safeParse(FileSystem.Paths.document.uri)
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

function copyFileE({
  from,
  to,
}: {
  from: UriString
  to: UriString
}): Effect.Effect<UriString, FileSystemError> {
  return Effect.try({
    try: () => {
      new FileSystem.File(from).copy(new FileSystem.File(to))
      return from
    },
    catch(error) {
      return {
        _tag: 'fileSystemError',
        error,
      } as FileSystemError
    },
  })
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
      effectToTaskEither(copyFileE({from: sourceUri, to: fullPathToNewFile}))
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
