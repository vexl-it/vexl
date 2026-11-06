import {type BlogPost as CmsBlogPost} from '@vexl-next/domain/src/general/cms'
import {Array, Option, Order, pipe} from 'effect'
import {type Locale} from '../i18n/locales'
import {loadPublishedBlogPosts} from './contentService'

export interface BlogPost {
  readonly slug: string
  readonly title: string
  readonly date: Date
  readonly summary: string
  readonly imageUrl: Option.Option<string>
  readonly featured: boolean
  /** HTML from the CMS; render it through `renderRichText`. */
  readonly body: string
  readonly locales: readonly Locale[]
}

export const BLOG_PAGE_SIZE = 8

const newestFirst = Order.reverse(
  Order.combine(
    Order.mapInput(Order.Date, (post: CmsBlogPost) => post.publishedAt),
    Order.mapInput(Order.Date, (post: CmsBlogPost) => post.createdAt)
  )
)

function localize(post: CmsBlogPost, locale: Locale): Option.Option<BlogPost> {
  return pipe(
    locale === 'en' ? Option.some(post.en) : post.cs,
    Option.map((content) => ({
      slug: post.slug,
      title: content.title,
      date: post.publishedAt,
      summary: Option.getOrElse(content.summary, () => ''),
      imageUrl: post.imageUrl,
      featured: post.featured,
      body: content.body,
      locales: Option.isSome(post.cs) ? ['en', 'cs'] : ['en'],
    }))
  )
}

/** Every post published in the locale, newest first. */
export async function blogPosts(locale: Locale): Promise<readonly BlogPost[]> {
  return pipe(
    await loadPublishedBlogPosts(),
    Array.sort(newestFirst),
    Array.filterMap((post) => localize(post, locale))
  )
}

export function findBlogPost(
  posts: readonly BlogPost[],
  slug: string
): Option.Option<BlogPost> {
  return Array.findFirst(posts, (post) => post.slug === slug)
}

/** The newest featured post; older featured posts stay in the list. */
export function featuredBlogPost(
  posts: readonly BlogPost[]
): Option.Option<BlogPost> {
  return Array.findFirst(posts, (post) => post.featured)
}

/** The blog list, without the featured post. */
export function listedBlogPosts(posts: readonly BlogPost[]): BlogPost[] {
  const featured = featuredBlogPost(posts)
  return Array.filter(
    posts,
    (post) => !Option.exists(featured, ({slug}) => slug === post.slug)
  )
}

export function blogPageCount(posts: readonly BlogPost[]): number {
  return Math.ceil(listedBlogPosts(posts).length / BLOG_PAGE_SIZE)
}

/** One page of the blog list, numbered from 1. */
export function blogPage(posts: readonly BlogPost[], page: number): BlogPost[] {
  return listedBlogPosts(posts).slice(
    (page - 1) * BLOG_PAGE_SIZE,
    page * BLOG_PAGE_SIZE
  )
}

/** Webflow's "Related Articles": the first three other listed posts. */
export function relatedBlogPosts(
  posts: readonly BlogPost[],
  slug: string
): BlogPost[] {
  return pipe(
    listedBlogPosts(posts),
    Array.filter((post) => post.slug !== slug),
    Array.take(3)
  )
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'Europe/Prague',
})

/** Webflow shows dates in English on every locale, in the site's time zone. */
export function formatBlogDate(date: Date): string {
  return dateFormat.format(date)
}
