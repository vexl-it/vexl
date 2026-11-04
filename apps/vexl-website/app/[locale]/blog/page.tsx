import {Array, pipe} from 'effect'
import {type Metadata} from 'next'
import React from 'react'
import {getBlogPosts} from '../../../src/content/blog'
import {toSummary} from '../../../src/content/blogSummary'
import {pageMetadata} from '../../../src/metadata'
import {resolveLocale, type LocaleParams} from '../../../src/pageParams'
import {BlogView} from '../../../src/views/BlogView'

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  return pageMetadata(await resolveLocale(props), 'blog', '/blog')
}

export default function BlogPage(): React.JSX.Element {
  const posts = pipe(getBlogPosts(), Array.map(toSummary))
  const featured = pipe(
    posts,
    Array.findFirst((post) => post.featured)
  )
  return (
    <BlogView
      featured={featured._tag === 'Some' ? featured.value : undefined}
      posts={pipe(
        posts,
        Array.filter((post) => !post.featured)
      )}
    />
  )
}
