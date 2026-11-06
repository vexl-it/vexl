import {blogPageCount, blogPosts} from '@/src/content/blog'
import {type Locale} from '@/src/i18n/locales'
import {resolveListPage, resolveLocale} from '@/src/pageParams'
import {BlogIndex, blogIndexMetadata} from '@/src/views/blog/BlogIndex'
import {type Metadata} from 'next'
import React from 'react'

interface Props {
  readonly params: Promise<{locale: string; page: string}>
}

export const dynamic = 'force-dynamic'

async function resolvePage(
  props: Props
): Promise<{locale: Locale; page: number}> {
  const locale = await resolveLocale(props)
  const posts = await blogPosts(locale)
  return {
    locale,
    page: resolveListPage((await props.params).page, blogPageCount(posts)),
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const {locale, page} = await resolvePage(props)
  return await blogIndexMetadata(locale, page)
}

export default async function BlogListPage(
  props: Props
): Promise<React.JSX.Element> {
  const {locale, page} = await resolvePage(props)
  return <BlogIndex locale={locale} page={page} />
}
