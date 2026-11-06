import {Array, Either, Record, Schema} from 'effect'
import csAudit from '../../content/copy/cs/audit.json'
import csBlog from '../../content/copy/cs/blog.json'
import csCommunity from '../../content/copy/cs/community.json'
import csDownload from '../../content/copy/cs/download.json'
import csFaq from '../../content/copy/cs/faq.json'
import csHome from '../../content/copy/cs/home.json'
import csNotFound from '../../content/copy/cs/not-found.json'
import csShared from '../../content/copy/cs/shared.json'
import csTermsPrivacy from '../../content/copy/cs/terms-privacy.json'
import enAudit from '../../content/copy/en/audit.json'
import enBlog from '../../content/copy/en/blog.json'
import enCommunity from '../../content/copy/en/community.json'
import enDownload from '../../content/copy/en/download.json'
import enFaq from '../../content/copy/en/faq.json'
import enHome from '../../content/copy/en/home.json'
import enNotFound from '../../content/copy/en/not-found.json'
import enShared from '../../content/copy/en/shared.json'
import enTermsPrivacy from '../../content/copy/en/terms-privacy.json'
import {type Locale} from '../i18n/locales'
import {CopyText} from './inlineCopy'

export class CopyFileError extends Schema.TaggedError<CopyFileError>()(
  'CopyFileError',
  {file: Schema.String, message: Schema.String}
) {}

const files = {
  shared: {en: enShared, cs: csShared},
  home: {en: enHome, cs: csHome},
  download: {en: enDownload, cs: csDownload},
  community: {en: enCommunity, cs: csCommunity},
  blog: {en: enBlog, cs: csBlog},
  faq: {en: enFaq, cs: csFaq},
  audit: {en: enAudit, cs: csAudit},
  'terms-privacy': {en: enTermsPrivacy, cs: csTermsPrivacy},
  'not-found': {en: enNotFound, cs: csNotFound},
}

export type CopyPage = keyof typeof files
export type CopyKey<Page extends CopyPage> = keyof (typeof files)[Page]['en'] &
  string

const decode = Schema.decodeUnknownEither(
  Schema.Record({key: Schema.String, value: CopyText}),
  {errors: 'all'}
)

function decodeCopyFile(
  page: string,
  locale: Locale,
  json: unknown
): readonly string[] {
  return Either.match(decode(json), {
    onLeft: (error) => {
      throw new CopyFileError({
        file: `content/copy/${locale}/${page}.json`,
        message: error.message,
      })
    },
    onRight: Record.keys,
  })
}

/**
 * `content/copy/<locale>/<page>.json`, checked when the site loads: every
 * value is valid copy, and Czech has exactly the keys English has.
 */
function decodeCopyFiles<
  Files extends Record.ReadonlyRecord<
    CopyPage,
    Record.ReadonlyRecord<Locale, unknown>
  >,
>(pages: Files): Files {
  Array.forEach(Record.toEntries(pages), ([page, {en, cs}]) => {
    const englishKeys = decodeCopyFile(page, 'en', en)
    const czechKeys = decodeCopyFile(page, 'cs', cs)
    const mismatched = Array.union(
      Array.difference(englishKeys, czechKeys),
      Array.difference(czechKeys, englishKeys)
    )
    if (Array.isNonEmptyArray(mismatched))
      throw new CopyFileError({
        file: `content/copy/cs/${page}.json`,
        message: `Keys differ from English: ${Array.join(mismatched, ', ')}`,
      })
  })
  return pages
}

/** Each page's copy by locale. Typing it like this makes a key missing in Czech a type error. */
export const copyPages: {
  readonly [Page in CopyPage]: Record.ReadonlyRecord<
    Locale,
    Record.ReadonlyRecord<CopyKey<Page>, string>
  >
} = decodeCopyFiles(files)

export const isCopyPage = (page: string): page is CopyPage =>
  Object.hasOwn(copyPages, page)
