import {Array, Option, pipe} from 'effect'
import {type BlogPost, blogPostsByDate} from '../../../../../src/content/blog'
import {SITE_URL} from '../../../../../src/metadata'

export const dynamic = 'force-static'
export const dynamicParams = false

// Webflow only publishes the English feed
export function generateStaticParams(): Array<{locale: string}> {
  return [{locale: 'en'}]
}

const escapeXml = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

function item(post: BlogPost): string {
  const link = `${SITE_URL}/post/${post.slug}`
  const media = Option.match(post.image, {
    onNone: () => '',
    onSome: (image) => {
      const url = escapeXml(encodeURI(`${SITE_URL}${image.src}`))
      return `<media:content url="${url}" medium="image"/><media:thumbnail url="${url}"/>`
    },
  })
  return `<item><title>${escapeXml(post.title)}</title><link>${link}</link><guid>${link}</guid><description>${escapeXml(post.summary)}</description><pubDate>${post.date.toUTCString()}</pubDate>${media}</item>`
}

export function GET(): Response {
  const posts = blogPostsByDate('en')
  const updated = pipe(
    Array.head(posts),
    Option.map((post) => post.date),
    Option.getOrElse(() => new Date())
  )
  const feed = `<?xml version="1.0" encoding="utf-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>Vexl blog</title><link>${SITE_URL}</link><description>Rss Channel vexl blog</description><pubDate>${updated.toUTCString()}</pubDate><atom:link href="${SITE_URL}/post/rss.xml" rel="self" type="application/rss+xml"/>${pipe(posts, Array.map(item), Array.join(''))}</channel></rss>`
  return new Response(feed, {
    headers: {'Content-Type': 'application/rss+xml; charset=utf-8'},
  })
}
