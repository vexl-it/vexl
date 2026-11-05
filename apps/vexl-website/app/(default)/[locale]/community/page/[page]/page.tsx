import {Array, pipe} from 'effect'
import {type Metadata} from 'next'
import React from 'react'
import {resolveLocale} from '../../../../../../src/pageParams'
import {
  CommunityPage,
  communityMetadata,
} from '../../../../../../src/views/community/CommunityPage'
import {pastEventsPageCount} from '../../../../../../src/views/community/events'

interface Props {
  readonly params: Promise<{locale: string; page: string}>
}

export const dynamicParams = false

/** Pages after the first; the first one is /community. */
export function generateStaticParams(): Array<{page: string}> {
  return pipe(
    Array.range(1, pastEventsPageCount()),
    Array.filter((page) => page > 1),
    Array.map((page) => ({page: String(page)}))
  )
}

const resolvePage = async (props: Props): Promise<number> =>
  Number((await props.params).page)

export async function generateMetadata(props: Props): Promise<Metadata> {
  return communityMetadata(await resolveLocale(props), await resolvePage(props))
}

export default async function CommunityListPage(
  props: Props
): Promise<React.JSX.Element> {
  return (
    <CommunityPage
      locale={await resolveLocale(props)}
      page={await resolvePage(props)}
    />
  )
}
