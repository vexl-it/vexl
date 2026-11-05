import {Array, pipe, Schema} from 'effect'
import {readContentFile} from '../../content/files'
import {type Locale} from '../../i18n/locales'

export interface FaqCardContent {
  /** Inline markdown. */
  readonly question: string
  /** Markdown with inline HTML. */
  readonly answer: string
}

export interface FaqSectionContent {
  readonly id: string
  /** Inline markdown. */
  readonly title: string
  readonly cards: readonly FaqCardContent[]
}

export class FaqContentError extends Schema.TaggedError<FaqContentError>()(
  'FaqContentError',
  {heading: Schema.String}
) {}

const SECTION_HEADING = /^(.+) \{#([\w-]+)\}$/

function parseCard(chunk: string): FaqCardContent {
  const [question = '', ...answer] = chunk.split('\n')
  return {question: question.trim(), answer: answer.join('\n').trim()}
}

function parseSection(chunk: string): FaqSectionContent {
  const [heading = '', ...cards] = chunk.split(/^### /m)
  const [, title, id] = SECTION_HEADING.exec(heading.trim()) ?? []
  if (title === undefined || id === undefined)
    throw new FaqContentError({heading})
  return {id, title, cards: Array.map(cards, parseCard)}
}

/**
 * `content/faq/<locale>.md`: each `## Title {#id}` starts a section, each
 * `### Question` a card whose answer runs until the next heading of either level.
 */
export function faqSections(locale: Locale): readonly FaqSectionContent[] {
  return pipe(
    readContentFile('faq', `${locale}.md`).split(/^## /m),
    Array.drop(1),
    Array.map(parseSection)
  )
}

export function markdownToPlainText(markdown: string): string {
  return pipe(
    markdown.split(/\n{2,}/),
    Array.map((block) =>
      block
        .replace(/^#+ /, '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/<[^>]+>|\*\*/g, '')
        .replace(/\\(.)/g, '$1')
        .trim()
    ),
    Array.join(' ')
  )
}
