import {resolveLocale, type LocaleParams} from '@/src/pageParams'
import {
  CommunityPage,
  communityMetadata,
} from '@/src/views/community/CommunityPage'
import {loadEvents} from '@/src/views/community/events'
import {type Metadata} from 'next'
import React from 'react'

export const dynamic = 'force-dynamic'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  return communityMetadata(await resolveLocale(props), 1)
}

export default async function Community(
  props: LocaleParams
): Promise<React.JSX.Element> {
  return (
    <CommunityPage
      locale={await resolveLocale(props)}
      events={await loadEvents()}
      page={1}
    />
  )
}
