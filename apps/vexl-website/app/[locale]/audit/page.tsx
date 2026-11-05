import {type Metadata} from 'next'
import React from 'react'
import {pageMetadata} from '../../../src/metadata'
import {resolveLocale, type LocaleParams} from '../../../src/pageParams'
import {AuditView} from '../../../src/views/AuditView'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  return pageMetadata(await resolveLocale(props), 'audit', '/audit')
}

export default function AuditPage(): React.JSX.Element {
  return <AuditView />
}
