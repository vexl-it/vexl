import {Array, Option, Order, pipe, Schema} from 'effect'
import matter from 'gray-matter'
import {type Locale} from '../i18n/locales'
import {listContentFiles, readContentFile} from './files'

const BlogImage = Schema.Struct({
  src: Schema.String,
  srcSet: Schema.optional(Schema.String),
})
export type BlogImage = typeof BlogImage.Type

const PostFrontmatter = Schema.Struct({
  title: Schema.String,
  date: Schema.Date,
  summary: Schema.String,
  image: Schema.optional(BlogImage),
  /** Shown above the list on the blog page instead of in it. */
  featured: Schema.optional(Schema.Boolean),
  /** Position on the blog list, highest first. Unlisted when missing. */
  listOrder: Schema.optional(Schema.Number),
  /** Present when the post is published on the Czech site. */
  cs: Schema.optional(
    Schema.Struct({
      listOrder: Schema.optional(Schema.Number),
      date: Schema.optional(Schema.Date),
    })
  ),
})

/** `<slug>.cs.md`: a post translated to Czech. */
const TranslationFrontmatter = Schema.Struct({
  title: Schema.String,
  summary: Schema.String,
})

export interface BlogPost {
  readonly slug: string
  readonly title: string
  readonly date: Date
  readonly summary: string
  readonly image: Option.Option<BlogImage>
  readonly featured: boolean
  readonly listOrder: Option.Option<number>
  /** Markdown with raw HTML where Webflow's rich text needs it. */
  readonly body: string
  readonly locales: readonly Locale[]
}

export const BLOG_PAGE_SIZE = 8

const files = listContentFiles('blog')
const isTranslation = (file: string): boolean => file.endsWith('.cs.md')

function loadPost(file: string): Record<Locale, Option.Option<BlogPost>> {
  const slug = file.replace(/\.md$/, '')
  const source = matter(readContentFile('blog', file))
  const front = Schema.decodeUnknownSync(PostFrontmatter)(source.data)
  const en: BlogPost = {
    slug,
    title: front.title,
    date: front.date,
    summary: front.summary,
    image: Option.fromNullable(front.image),
    featured: front.featured ?? false,
    listOrder: Option.fromNullable(front.listOrder),
    body: source.content,
    locales: front.cs ? ['en', 'cs'] : ['en'],
  }
  const translationFile = `${slug}.cs.md`
  const translation = Array.contains(files, translationFile)
    ? Option.some(matter(readContentFile('blog', translationFile)))
    : Option.none()
  return {
    en: Option.some(en),
    cs: pipe(
      Option.fromNullable(front.cs),
      Option.map((cs) => ({
        ...en,
        date: cs.date ?? en.date,
        listOrder: Option.fromNullable(cs.listOrder),
        ...Option.match(translation, {
          onNone: () => ({}),
          onSome: (translated) => ({
            ...Schema.decodeUnknownSync(TranslationFrontmatter)(
              translated.data
            ),
            body: translated.content,
          }),
        }),
      }))
    ),
  }
}

const loaded = pipe(
  files,
  Array.filter((file) => file.endsWith('.md') && !isTranslation(file)),
  Array.map(loadPost)
)

const byListOrder = Order.reverse(
  Order.mapInput(
    Option.getOrder(Order.number),
    (post: BlogPost) => post.listOrder
  )
)

/** Every post published in the locale. */
export function blogPosts(locale: Locale): readonly BlogPost[] {
  return pipe(
    loaded,
    Array.filterMap((post) => post[locale])
  )
}

export function findBlogPost(
  locale: Locale,
  slug: string
): Option.Option<BlogPost> {
  return pipe(
    blogPosts(locale),
    Array.findFirst((post) => post.slug === slug)
  )
}

/** The blog list (without the featured post), in Webflow's order. */
export function listedBlogPosts(locale: Locale): readonly BlogPost[] {
  return pipe(
    blogPosts(locale),
    Array.filter((post) => Option.isSome(post.listOrder)),
    Array.sort(byListOrder)
  )
}

export function featuredBlogPost(locale: Locale): Option.Option<BlogPost> {
  return pipe(
    blogPosts(locale),
    Array.findFirst((post) => post.featured)
  )
}

export function blogPageCount(locale: Locale): number {
  return Math.ceil(listedBlogPosts(locale).length / BLOG_PAGE_SIZE)
}

/** One page of the blog list, numbered from 1. */
export function blogPage(locale: Locale, page: number): readonly BlogPost[] {
  return listedBlogPosts(locale).slice(
    (page - 1) * BLOG_PAGE_SIZE,
    page * BLOG_PAGE_SIZE
  )
}

/** Webflow's "Related Articles": the first three other listed posts. */
export function relatedBlogPosts(
  locale: Locale,
  slug: string
): readonly BlogPost[] {
  return pipe(
    listedBlogPosts(locale),
    Array.filter((post) => post.slug !== slug),
    Array.take(3)
  )
}

/** Newest first, like Webflow's RSS feed. */
export function blogPostsByDate(locale: Locale): readonly BlogPost[] {
  return pipe(
    blogPosts(locale),
    Array.sort(
      Order.combine(
        Order.reverse(
          Order.mapInput(Order.Date, (post: BlogPost) => post.date)
        ),
        byListOrder
      )
    )
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
