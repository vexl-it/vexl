'use server'

import {Array, Either, Schema} from 'effect'
import fs from 'node:fs/promises'
import path from 'node:path'
import {isCopyPage} from '../copy/copyFiles'
import {CopyText} from '../copy/inlineCopy'
import {locales} from '../i18n/locales'

const COPY_DIR = path.join(process.cwd(), 'content', 'copy')

const SaveCopyInput = Schema.Struct({
  page: Schema.String.pipe(Schema.filter(isCopyPage)),
  key: Schema.String,
  en: CopyText,
  cs: CopyText,
})

const CopyFile = Schema.parseJson(
  Schema.Record({key: Schema.String, value: Schema.String})
)

export type SaveCopyResult =
  | {readonly ok: true}
  | {readonly ok: false; readonly error: string}

/**
 * Writes one key's English and Czech value into `content/copy`. Only exists
 * under `next dev`: the editor that imports it is left out of builds.
 */
export async function saveCopy(input: unknown): Promise<SaveCopyResult> {
  if (process.env.NODE_ENV !== 'development')
    return {ok: false, error: 'Copy can only be edited under next dev'}

  const decoded = Schema.decodeUnknownEither(SaveCopyInput)(input)
  if (Either.isLeft(decoded)) return {ok: false, error: decoded.left.message}
  const {page, key, ...values} = decoded.right

  const files = Either.all(
    await Promise.all(
      Array.map(locales, async (locale) => {
        const file = path.join(COPY_DIR, locale, `${page}.json`)
        return Schema.decodeUnknownEither(CopyFile)(
          await fs.readFile(file, 'utf8')
        ).pipe(
          Either.mapLeft((error) => `${file} is not valid: ${error.message}`),
          Either.filterOrLeft(
            (copy) => Object.hasOwn(copy, key),
            () => `${page} has no key "${key}"`
          ),
          // Spreading keeps the key order, so the diff is the changed line only
          Either.map((copy) => ({
            file,
            json: `${JSON.stringify({...copy, [key]: values[locale]}, null, 2)}\n`,
          }))
        )
      })
    )
  )
  if (Either.isLeft(files)) return {ok: false, error: files.left}

  await Promise.all(
    Array.map(files.right, async ({file, json}) => {
      await fs.writeFile(file, json)
    })
  )
  return {ok: true}
}
