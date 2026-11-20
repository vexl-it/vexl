import {Array, Either, Record, Schema} from 'effect'
import home from '../../content/copy/home.json'
import notFound from '../../content/copy/not-found.json'
import {CopyText} from './inlineCopy'

export class CopyFileError extends Schema.TaggedError<CopyFileError>()(
  'CopyFileError',
  {file: Schema.String, message: Schema.String}
) {}

const files = {
  home,
  'not-found': notFound,
}

export type CopyPage = keyof typeof files
export type CopyKey<Page extends CopyPage> = keyof (typeof files)[Page] & string

const decode = Schema.decodeUnknownEither(
  Schema.Record({key: Schema.String, value: CopyText}),
  {errors: 'all'}
)

/**
 * `content/copy/<page>.json`, checked when the site loads: every value is
 * valid copy.
 */
function decodeCopyFiles<
  Files extends Record.ReadonlyRecord<CopyPage, unknown>,
>(pages: Files): Files {
  Array.forEach(Record.toEntries(pages), ([page, json]) => {
    Either.match(decode(json), {
      onLeft: (error) => {
        throw new CopyFileError({
          file: `content/copy/${page}.json`,
          message: error.message,
        })
      },
      onRight: () => undefined,
    })
  })
  return pages
}

export const copyPages: {
  readonly [Page in CopyPage]: Record.ReadonlyRecord<CopyKey<Page>, string>
} = decodeCopyFiles(files)

export const isCopyPage = (page: string): page is CopyPage =>
  Object.hasOwn(copyPages, page)
