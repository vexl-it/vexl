import {type Metadata} from 'next'
import React from 'react'
import {Markdown} from '../../../src/components/Markdown'
import {getTermsAndPrivacy} from '../../../src/content/terms'
import {pageMetadata} from '../../../src/metadata'
import {resolveLocale, type LocaleParams} from '../../../src/pageParams'
import {TermsView} from '../../../src/views/TermsView'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  return pageMetadata(await resolveLocale(props), 'terms', '/terms-privacy')
}

export default function TermsPage(): React.JSX.Element {
  return <TermsView body={<Markdown>{getTermsAndPrivacy()}</Markdown>} />
}
