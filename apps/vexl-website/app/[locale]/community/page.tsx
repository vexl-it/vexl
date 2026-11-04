import {type Metadata} from 'next'
import React from 'react'
import {getCommunityEvents} from '../../../src/content/events'
import {pageMetadata} from '../../../src/metadata'
import {resolveLocale, type LocaleParams} from '../../../src/pageParams'
import {CommunityView} from '../../../src/views/CommunityView'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  return pageMetadata(await resolveLocale(props), 'community', '/community', {
    image: '/images/community-gallery.webp',
  })
}

export default function CommunityPage(): React.JSX.Element {
  const today = new Date().toISOString().slice(0, 10)
  return <CommunityView events={getCommunityEvents(today)} />
}
