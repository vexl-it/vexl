import {type Locale} from '@/src/i18n/locales'
import {resolveListPage, resolveLocale} from '@/src/pageParams'
import {
  CommunityPage,
  communityMetadata,
} from '@/src/views/community/CommunityPage'
import {
  type Events,
  loadEvents,
  pastEventsPageCount,
} from '@/src/views/community/events'
import {type Metadata} from 'next'
import React from 'react'

interface Props {
  readonly params: Promise<{locale: string; page: string}>
}

export const dynamic = 'force-dynamic'

async function resolvePage(
  props: Props
): Promise<{locale: Locale; events: Events; page: number}> {
  const locale = await resolveLocale(props)
  const events = await loadEvents()
  return {
    locale,
    events,
    page: resolveListPage(
      (await props.params).page,
      pastEventsPageCount(events.past)
    ),
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const {locale, page} = await resolvePage(props)
  return communityMetadata(locale, page)
}

export default async function CommunityListPage(
  props: Props
): Promise<React.JSX.Element> {
  return <CommunityPage {...await resolvePage(props)} />
}
