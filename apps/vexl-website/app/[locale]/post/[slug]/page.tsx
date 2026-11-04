import {Array, Option, pipe} from 'effect'
import {type Metadata} from 'next'
import {notFound} from 'next/navigation'
import React from 'react'
import {Markdown} from '../../../../src/components/Markdown'
import {
  getBlogPost,
  getBlogPosts,
  type BlogPost,
} from '../../../../src/content/blog'
import {toSummary} from '../../../../src/content/blogSummary'
import {getMarkdownHeadings} from '../../../../src/content/headings'
import {locales} from '../../../../src/i18n/locales'
import {pageMetadata} from '../../../../src/metadata'
import {resolveLocale} from '../../../../src/pageParams'
import {BlogPostView} from '../../../../src/views/BlogPostView'

const RELATED_POSTS = 3

interface PostParams {
  readonly params: Promise<{locale: string; slug: string}>
}

export const dynamicParams = false

export function generateStaticParams(): Array<{locale: string; slug: string}> {
  return pipe(
    getBlogPosts(),
    Array.flatMap((post) =>
      locales.map((locale) => ({locale, slug: post.slug}))
    )
  )
}

async function loadPost({
  params,
}: PostParams): Promise<Option.Option<BlogPost>> {
  return getBlogPost((await params).slug)
}

export async function generateMetadata(props: PostParams): Promise<Metadata> {
  const locale = await resolveLocale(props)
  const post = Option.getOrElse(await loadPost(props), () => notFound())
  return pageMetadata(locale, 'blog', `/post/${post.slug}`, {
    title: `${post.title} - Blog │ Vexl`,
    description: post.summary || post.title,
    image: post.image,
  })
}

export default async function PostPage(
  props: PostParams
): Promise<React.JSX.Element> {
  const post = Option.getOrElse(await loadPost(props), () => notFound())
  const related = pipe(
    getBlogPosts(),
    Array.filter((other) => other.slug !== post.slug),
    Array.take(RELATED_POSTS),
    Array.map(toSummary)
  )
  return (
    <BlogPostView
      post={toSummary(post)}
      headings={getMarkdownHeadings(post.content)}
      related={related}
      body={<Markdown>{post.content}</Markdown>}
    />
  )
}
