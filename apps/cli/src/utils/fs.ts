import * as fs from 'node:fs'
import * as E from 'fp-ts/Either'
import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import {
  type BasicError,
  toBasicError,
} from '@vexl-next/domain/dist/utility/errors'

type FsError = BasicError<'FsError'>

export function saveFile(
  path: PathString
): (file: string) => E.Either<FsError, void> {
  return (file: string) =>
    E.tryCatch(() => {
      fs.writeFileSync(path, file)
    }, toBasicError('FsError'))
}

export function readFile(path: PathString): E.Either<FsError, string> {
  return E.tryCatch(() => {
    return fs.readFileSync(path, 'utf8')
  }, toBasicError('FsError'))
}
