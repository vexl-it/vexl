import {PathString} from '@vexl-next/domain/src/utility/PathString.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Effect, Either, pipe} from 'effect'
import * as FileSystem from 'expo-file-system'
import urlJoin from 'url-join'
import {safeParse} from './fpUtils'

export interface FileSystemError {
  _tag: 'fileSystemError'
  error: unknown
}
function documentDirectoryOrLeft(): Either.Either<string, FileSystemError> {
  const parseResult = UriString.safeParse(FileSystem.Paths.document.uri)
  if (parseResult.success) {
    return Either.right(parseResult.data)
  }
  return Either.left({
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
): Either.Either<PathString, FileSystemError> {
  const splitPath = path.split('/')
  return pipe(
    splitPath.at(-1),
    Either.right,
    Either.flatMap(safeParse(PathString)),
    Either.mapLeft((e) => ({_tag: 'fileSystemError', error: e}))
  )
}

export function copyFileToNewPath({
  localDirectoryFilePath,
  sourceUri,
}: {
  localDirectoryFilePath: PathString
  sourceUri: UriString
}): Effect.Effect<UriString, FileSystemError> {
  const eitherResult = pipe(
    documentDirectoryOrLeft(),
    Either.map((documentDirectory) =>
      FileSystem.Paths.join(documentDirectory, localDirectoryFilePath)
    ),
    Either.flatMap(safeParse(UriString)),
    Either.mapLeft((e) => {
      if (e._tag === 'ParseError') {
        return {
          _tag: 'fileSystemError',
          error: e.error,
        } as FileSystemError
      }
      return e
    })
  )

  return Either.match(eitherResult, {
    onLeft: (error) => Effect.fail(error),
    onRight: (fullPathToNewFile) =>
      copyFileE({from: sourceUri, to: fullPathToNewFile}),
  })
}

export function copyFileLocalDirectoryAndKeepName({
  sourceUri,
  targetFolder,
}: {
  sourceUri: UriString
  targetFolder: PathString
}): Effect.Effect<UriString, FileSystemError> {
  const eitherResult = pipe(
    filenameOrLeft(sourceUri),
    Either.map((fileName) => urlJoin(targetFolder, fileName)),
    Either.flatMap(safeParse(PathString)),
    Either.mapLeft((e) => {
      if (e._tag === 'ParseError') {
        return {
          _tag: 'fileSystemError',
          error: e.error,
        } as FileSystemError
      }
      return e
    })
  )

  return Either.match(eitherResult, {
    onLeft: (error) => Effect.fail(error),
    onRight: (fullPathToNewFile) =>
      copyFileToNewPath({sourceUri, localDirectoryFilePath: fullPathToNewFile}),
  })
}
