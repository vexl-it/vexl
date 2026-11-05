import {toLocale} from '@/src/i18n/locales'
import {resolveLocale} from '@/src/pageParams'
import {
  CommunityPage,
  communityMetadata,
} from '@/src/views/community/CommunityPage'
import {pastEventsPageCount} from '@/src/views/community/events'
import {Array, Option, pipe} from 'effect'
import {type Metadata} from 'next'
import React from 'react'

interface Props {
  readonly params: Promise<{locale: string; page: string}>
}

export const dynamicParams = false

/** Pages after the first; the first one is /community. */
export function generateStaticParams({
  params,
}: {
  readonly params: {locale: string}
}): Array<{page: string}> {
  return pipe(
    toLocale(params.locale),
    Option.match({
      onNone: () => [],
      onSome: (locale) =>
        pipe(
          Array.range(1, pastEventsPageCount(locale)),
          Array.filter((page) => page > 1),
          Array.map((page) => ({page: String(page)}))
        ),
    })
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
