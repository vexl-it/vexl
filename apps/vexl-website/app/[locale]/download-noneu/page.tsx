import {type Metadata} from 'next'
import React from 'react'
import {pageMetadata} from '../../../src/metadata'
import {resolveLocale, type LocaleParams} from '../../../src/pageParams'
import {DownloadView} from '../../../src/views/DownloadView'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  return pageMetadata(
    await resolveLocale(props),
    'downloadNonEu',
    '/download-noneu'
  )
}

export default function DownloadNonEuPage(): React.JSX.Element {
  return <DownloadView variant="nonEu" />
}
