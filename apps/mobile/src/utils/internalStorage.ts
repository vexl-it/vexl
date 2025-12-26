import {PathString} from '@vexl-next/domain/src/utility/PathString.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Effect, Option, Schema} from 'effect'
import * as FileSystem from 'expo-file-system'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import urlJoin from 'url-join'

export interface FileSystemError {
  _tag: 'fileSystemError'
  error: unknown
}
function documentDirectoryOrLeft(): E.Either<FileSystemError, string> {
  const parseResult = Schema.decodeUnknownOption(UriString)(
    FileSystem.Paths.document.uri
  )
  if (Option.isSome(parseResult)) {
    return E.right(parseResult.value)
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
    E.chainW(Schema.decodeUnknownEither(PathString)),
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
      FileSystem.Paths.join(documentDirectory, localDirectoryFilePath)
    ),
    E.chainW(Schema.decodeUnknownEither(UriString)),
    TE.fromEither,
    TE.chainW((fullPathToNewFile) =>
      effectToTaskEither(copyFileE({from: sourceUri, to: fullPathToNewFile}))
    ),
    TE.mapLeft((e) => {
      if (e._tag === 'ParseError') {
        return {
          _tag: 'fileSystemError',
          error: e.cause,
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
    E.chainW(Schema.decodeUnknownEither(PathString)),
    TE.fromEither,
    TE.chainW((fullPathToNewFile) =>
      copyFileToNewPath({sourceUri, localDirectoryFilePath: fullPathToNewFile})
    ),
    TE.mapLeft((e) => {
      if (e._tag === 'ParseError') {
        return {
          _tag: 'fileSystemError',
          error: e.cause,
        }
      }
      return e
    })
  )
}
