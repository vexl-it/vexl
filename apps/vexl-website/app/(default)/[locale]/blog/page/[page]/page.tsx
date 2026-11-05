import {Array, Option, pipe} from 'effect'
import {type Metadata} from 'next'
import React from 'react'
import {blogPageCount} from '../../../../../../src/content/blog'
import {toLocale} from '../../../../../../src/i18n/locales'
import {resolveLocale} from '../../../../../../src/pageParams'
import {
  BlogIndex,
  blogIndexMetadata,
} from '../../../../../../src/views/blog/BlogIndex'

interface Props {
  readonly params: Promise<{locale: string; page: string}>
}

export const dynamicParams = false

/** Pages after the first; the first one is /blog. */
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
          Array.range(1, blogPageCount(locale)),
          Array.filter((page) => page > 1),
          Array.map((page) => ({page: String(page)}))
        ),
    })
  )
}

const resolvePage = async (props: Props): Promise<number> =>
  Number((await props.params).page)

export async function generateMetadata(props: Props): Promise<Metadata> {
  return blogIndexMetadata(await resolveLocale(props), await resolvePage(props))
}

export default async function BlogListPage(
  props: Props
): Promise<React.JSX.Element> {
  return (
    <BlogIndex
      locale={await resolveLocale(props)}
      page={await resolvePage(props)}
    />
  )
}
