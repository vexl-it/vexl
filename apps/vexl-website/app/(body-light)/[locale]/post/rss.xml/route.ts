import {type BlogPost, blogPosts} from '@/src/content/blog'
import {pageCopy} from '@/src/copy/pageCopy'
import {SITE_URL} from '@/src/metadata'
import {Array, Option, pipe} from 'effect'

// English only, like Webflow; proxy.ts sends /cs/post/rss.xml to the 404 page
export const dynamic = 'force-dynamic'

const escapeXml = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

function item(post: BlogPost): string {
  const link = `${SITE_URL}/post/${post.slug}`
  const media = Option.match(post.imageUrl, {
    onNone: () => '',
    onSome: (imageUrl) => {
      const url = escapeXml(imageUrl)
      return `<media:content url="${url}" medium="image"/><media:thumbnail url="${url}"/>`
    },
  })
  return `<item><title>${escapeXml(post.title)}</title><link>${link}</link><guid>${link}</guid><description>${escapeXml(post.summary)}</description><pubDate>${post.date.toUTCString()}</pubDate>${media}</item>`
}

export async function GET(): Promise<Response> {
  const t = pageCopy('en', 'blog')
  const posts = await blogPosts('en')
  const updated = pipe(
    Array.head(posts),
    Option.map((post) => post.date),
    Option.getOrElse(() => new Date())
  )
  const feed = `<?xml version="1.0" encoding="utf-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>${escapeXml(t.text('rss.title'))}</title><link>${SITE_URL}</link><description>${escapeXml(t.text('rss.description'))}</description><pubDate>${updated.toUTCString()}</pubDate><atom:link href="${SITE_URL}/post/rss.xml" rel="self" type="application/rss+xml"/>${pipe(posts, Array.map(item), Array.join(''))}</channel></rss>`
  return new Response(feed, {
    headers: {'Content-Type': 'application/rss+xml; charset=utf-8'},
  })
}
