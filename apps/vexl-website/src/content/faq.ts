import {Array, pipe} from 'effect'
import GithubSlugger from 'github-slugger'
import {type Locale} from '../i18n/locales'
import {readContentFile} from './files'

export interface FaqItem {
  readonly question: string
  readonly answer: string
}

export interface FaqCategory {
  readonly id: string
  readonly title: string
  readonly items: readonly FaqItem[]
}

function splitByHeading(
  markdown: string,
  marker: string
): ReadonlyArray<{readonly heading: string; readonly body: string}> {
  return pipe(
    markdown.split(new RegExp(`^${marker} `, 'm')),
    Array.drop(1),
    Array.map((chunk) => {
      const [heading = '', ...body] = chunk.split('\n')
      return {heading: heading.trim(), body: body.join('\n').trim()}
    })
  )
}

/** `## Category` and `### Question` headings, answer Markdown below each question. */
export function getFaq(locale: Locale): readonly FaqCategory[] {
  const slugger = new GithubSlugger()
  return pipe(
    splitByHeading(readContentFile('faq', `${locale}.md`), '##'),
    Array.map(({heading, body}) => ({
      id: slugger.slug(heading),
      title: heading,
      items: pipe(
        splitByHeading(body, '###'),
        Array.map(({heading: question, body: answer}) => ({question, answer}))
      ),
    }))
  )
}
