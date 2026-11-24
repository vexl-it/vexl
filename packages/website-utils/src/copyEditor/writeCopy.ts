import {Array, Either, Record, Schema} from 'effect'
import fs from 'node:fs/promises'
import {CopyText} from '../inlineCopy'

/** What the copy editor sends: one key's value in every language. */
export interface CopyEdit {
  readonly page: string
  readonly key: string
  readonly values: Record.ReadonlyRecord<string, string>
}

export type SaveCopyResult =
  | {readonly ok: true}
  | {readonly ok: false; readonly error: string}

const CopyFile = Schema.parseJson(
  Schema.Record({key: Schema.String, value: Schema.String})
)

/**
 * Writes one key's value in every language into the site's copy files. Only
 * works under `next dev`: the editor that calls it is left out of builds.
 */
export async function writeCopy(
  input: unknown,
  site: {
    readonly isPage: (page: string) => boolean
    readonly locales: readonly string[]
    /** The copy file of a page the site has, in one of its locales. */
    readonly file: (page: string, locale: string) => string
  }
): Promise<SaveCopyResult> {
  if (process.env.NODE_ENV !== 'development')
    return {ok: false, error: 'Copy can only be edited under next dev'}

  const decoded = Schema.decodeUnknownEither(
    Schema.Struct({
      page: Schema.String.pipe(Schema.filter(site.isPage)),
      key: Schema.String,
      values: Schema.Struct(
        Record.fromIterableWith(site.locales, (locale) => [locale, CopyText])
      ),
    })
  )(input)
  if (Either.isLeft(decoded)) return {ok: false, error: decoded.left.message}
  const {page, key, values} = decoded.right

  const files = Either.all(
    await Promise.all(
      Array.map(site.locales, async (locale) => {
        const file = site.file(page, locale)
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
