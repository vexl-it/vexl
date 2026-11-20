'use server'

import {Either, Schema} from 'effect'
import fs from 'node:fs/promises'
import path from 'node:path'
import {isCopyPage} from '../copy/copyFiles'
import {CopyText} from '../copy/inlineCopy'

const COPY_DIR = path.join(process.cwd(), 'content', 'copy')

const SaveCopyInput = Schema.Struct({
  page: Schema.String.pipe(Schema.filter(isCopyPage)),
  key: Schema.String,
  value: CopyText,
})

const CopyFile = Schema.parseJson(
  Schema.Record({key: Schema.String, value: Schema.String})
)

export type SaveCopyResult =
  | {readonly ok: true}
  | {readonly ok: false; readonly error: string}

/**
 * Writes one key's value into `content/copy/<page>.json`. Only exists under
 * `next dev`: the editor that imports it is left out of builds.
 */
export async function saveCopy(input: unknown): Promise<SaveCopyResult> {
  if (process.env.NODE_ENV !== 'development')
    return {ok: false, error: 'Copy can only be edited under next dev'}

  const decoded = Schema.decodeUnknownEither(SaveCopyInput)(input)
  if (Either.isLeft(decoded)) return {ok: false, error: decoded.left.message}
  const {page, key, value} = decoded.right

  const file = path.join(COPY_DIR, `${page}.json`)
  const updated = Schema.decodeUnknownEither(CopyFile)(
    await fs.readFile(file, 'utf8')
  ).pipe(
    Either.mapLeft((error) => `${file} is not valid: ${error.message}`),
    Either.filterOrLeft(
      (copy) => Object.hasOwn(copy, key),
      () => `${page} has no key "${key}"`
    ),
    // Spreading keeps the key order, so the diff is the changed line only
    Either.map(
      (copy) => `${JSON.stringify({...copy, [key]: value}, null, 2)}\n`
    )
  )
  if (Either.isLeft(updated)) return {ok: false, error: updated.left}

  await fs.writeFile(file, updated.right)
  return {ok: true}
}
