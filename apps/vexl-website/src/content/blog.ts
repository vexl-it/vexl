import {Array, type Option, Order, pipe, Schema} from 'effect'
import matter from 'gray-matter'
import {listContentFiles, readContentFile} from './files'

const WORDS_PER_MINUTE = 200

const BlogPostFrontmatter = Schema.Struct({
  title: Schema.String,
  date: Schema.DateFromSelf,
  author: Schema.String,
  summary: Schema.String,
  image: Schema.optional(Schema.String),
  featured: Schema.optionalWith(Schema.Boolean, {default: () => false}),
})

export interface BlogPost {
  readonly slug: string
  readonly title: string
  readonly date: string
  readonly author: string
  readonly summary: string
  readonly image?: string
  readonly featured: boolean
  readonly content: string
  readonly readingMinutes: number
}

function readBlogPost(fileName: string): BlogPost {
  const {data, content} = matter(readContentFile('blog', fileName))
  const frontmatter = Schema.decodeUnknownSync(BlogPostFrontmatter)(data)
  return {
    ...frontmatter,
    slug: fileName.replace(/\.md$/, ''),
    date: frontmatter.date.toISOString().slice(0, 10),
    content,
    readingMinutes: Math.max(
      1,
      Math.ceil(content.split(/\s+/).length / WORDS_PER_MINUTE)
    ),
  }
}

const byDateDescending = Order.reverse(
  Order.mapInput(Order.string, (post: BlogPost) => post.date)
)

export function getBlogPosts(): readonly BlogPost[] {
  return pipe(
    listContentFiles('blog'),
    Array.filter((fileName) => fileName.endsWith('.md')),
    Array.map(readBlogPost),
    Array.sort(byDateDescending)
  )
}

export function getBlogPost(slug: string): Option.Option<BlogPost> {
  return pipe(
    getBlogPosts(),
    Array.findFirst((post) => post.slug === slug)
  )
}
