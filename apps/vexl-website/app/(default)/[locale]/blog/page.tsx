import {type Metadata} from 'next'
import React from 'react'
import {type LocaleParams, resolveLocale} from '../../../../src/pageParams'
import {
  BlogIndex,
  blogIndexMetadata,
} from '../../../../src/views/blog/BlogIndex'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  return blogIndexMetadata(await resolveLocale(props), 1)
}

export default async function BlogPage(
  props: LocaleParams
): Promise<React.JSX.Element> {
  return <BlogIndex locale={await resolveLocale(props)} page={1} />
}
