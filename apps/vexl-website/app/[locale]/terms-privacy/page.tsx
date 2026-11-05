import {Array, pipe} from 'effect'
import {type Metadata} from 'next'
import React from 'react'
import {Markdown} from '../../../src/components/Markdown'
import {getMarkdownHeadings} from '../../../src/content/headings'
import {getTermsAndPrivacy} from '../../../src/content/terms'
import {pageMetadata} from '../../../src/metadata'
import {resolveLocale, type LocaleParams} from '../../../src/pageParams'
import {TermsView} from '../../../src/views/TermsView'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  return pageMetadata(await resolveLocale(props), 'terms', '/terms-privacy')
}

export default function TermsPage(): React.JSX.Element {
  const markdown = getTermsAndPrivacy()
  // Top-level headings are the documents; the first one is the welcome note
  const documents = pipe(
    getMarkdownHeadings(markdown),
    Array.filter((heading) => heading.depth === 1),
    Array.drop(1)
  )
  return (
    <TermsView documents={documents} body={<Markdown>{markdown}</Markdown>} />
  )
}
