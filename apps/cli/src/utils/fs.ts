import * as fs from 'node:fs'
import * as E from 'fp-ts/Either'
import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'

interface FsError {
  readonly type: 'FsError'
  error: unknown
}

export function saveFile(
  path: PathString
): (file: string) => E.Either<FsError, void> {
  return (file: string) =>
    E.tryCatch(
      () => {
        fs.writeFileSync(path, file)
      },
      (error) => ({type: 'FsError', error})
    )
}

export function readFile(path: PathString): E.Either<FsError, string> {
  return E.tryCatch(
    () => {
      return fs.readFileSync(path, 'utf8')
    },
    (error) => ({type: 'FsError', error})
  )
}
