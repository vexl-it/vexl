import {Array, Option, pipe} from 'effect'
import {type CopyKey} from '../../copy/copyFiles'
import {inlineCopyToPlainText} from '../../copy/inlineCopy'
import {type PageCopy} from '../../copy/pageCopy'
import {type Locale} from '../../i18n/locales'

type FaqKey = CopyKey<'faq'>

export interface FaqBlock {
  /** `<section>.<question>[.<part>].heading` is a subheading, `…answer` its paragraphs. */
  readonly type: 'heading' | 'answer'
  readonly key: FaqKey
}

export interface FaqQuestion {
  readonly key: FaqKey
  readonly blocks: readonly FaqBlock[]
}

export interface FaqSection {
  readonly id: string
  readonly title: FaqKey
  readonly questions: readonly FaqQuestion[]
}

// The anchors are the live site's, which differ per language
const sections: ReadonlyArray<{
  readonly key: string
  readonly id: Record<Locale, string>
}> = [
  {key: 'privacy', id: {en: 'privacy', cs: 'ochrana'}},
  {key: 'app', id: {en: 'app', cs: 'o-applikaci'}},
  {key: 'others', id: {en: 'others', cs: 'ostatni'}},
]

const QUESTION = '.question'

/**
 * The FAQ in `content/copy/<locale>/faq.json` order: `<section>.title`, then
 * per question `<section>.<question>.question` and its answer keys.
 */
export function faqSections(
  locale: Locale,
  t: PageCopy<'faq'>
): readonly FaqSection[] {
  return pipe(
    sections,
    Array.filterMap(({key, id}) =>
      pipe(
        t.keys,
        Array.findFirst((copyKey) => copyKey === `${key}.title`),
        Option.map((title) => ({
          id: id[locale],
          title,
          questions: pipe(
            t.keys,
            Array.filter(
              (copyKey) =>
                copyKey.startsWith(`${key}.`) && copyKey.endsWith(QUESTION)
            ),
            Array.map((question) => {
              const prefix = `${question.slice(0, -QUESTION.length)}.`
              return {
                key: question,
                blocks: pipe(
                  t.keys,
                  Array.filter(
                    (copyKey) =>
                      copyKey.startsWith(prefix) && copyKey !== question
                  ),
                  Array.map(
                    (copyKey): FaqBlock => ({
                      type: copyKey.endsWith('.heading') ? 'heading' : 'answer',
                      key: copyKey,
                    })
                  )
                ),
              }
            })
          ),
        }))
      )
    )
  )
}

export const answerParagraphs = (answer: string): readonly string[] =>
  answer.split(/\n{2,}/)

/** The question's whole answer as plain text, for the FAQ structured data. */
export function answerPlainText(
  question: FaqQuestion,
  t: PageCopy<'faq'>
): string {
  return pipe(
    question.blocks,
    Array.flatMap((block) =>
      block.type === 'heading'
        ? [t.text(block.key)]
        : Array.map(answerParagraphs(t.raw(block.key)), inlineCopyToPlainText)
    ),
    Array.join(' ')
  )
}
