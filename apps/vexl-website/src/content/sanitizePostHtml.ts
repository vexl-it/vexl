import {Array, Option, pipe} from 'effect'
import {type Element, type Nodes, type Root} from 'hast'
import rehypeParse from 'rehype-parse'
import rehypeSanitize, {type Options as SanitizeSchema} from 'rehype-sanitize'
import {unified} from 'unified'

const YOUTUBE_EMBED =
  /^https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([\w-]+)$/
const SITE_HOSTS = ['vexl.it', 'www.vexl.it']

/**
 * Post bodies come from the CMS as HTML, and anyone with an editor token can
 * store any HTML there. Only this allowlist reaches the page.
 */
const schema: SanitizeSchema = {
  tagNames: [
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'strong',
    'em',
    'a',
    'ul',
    'ol',
    'li',
    'blockquote',
    'br',
    'img',
    'figure',
    'figcaption',
    'iframe',
    // Webflow's figure styles target `figure > div`
    'div',
  ],
  strip: ['script', 'style'],
  attributes: {
    a: [
      ['href', /^(?:https?|mailto):/i],
      ['target', '_blank'],
    ],
    img: [['src', /^https:\/\/resources\.vexl\.it\//]],
    figure: [
      [
        'className',
        'w-richtext-figure-type-image',
        'w-richtext-figure-type-video',
        /^w-richtext-align-[a-z]+$/,
      ],
      ['style', /^(?:max-width|padding-bottom):\d+(?:\.\d+)?(?:px|%)$/],
    ],
    iframe: [['src', YOUTUBE_EMBED], 'title', 'allowFullScreen', 'frameBorder'],
  },
  protocols: {href: ['http', 'https', 'mailto'], src: ['https']},
}

export function elements(node: Root | Element): Element[] {
  return pipe(
    node.children,
    Array.flatMap((child) =>
      child.type === 'element' ? [child, ...elements(child)] : []
    )
  )
}

/** The sanitizer only drops a disallowed `src`, which would leave an empty frame or image. */
const hasSource = (node: Nodes): boolean =>
  node.type !== 'element' ||
  !Array.contains(['img', 'iframe'], node.tagName) ||
  node.properties.src !== undefined

function dropEmbedsWithoutSource(node: Root | Element): void {
  if (node.type === 'root')
    node.children = Array.filter(node.children, hasSource)
  else node.children = Array.filter(node.children, hasSource)
  for (const child of node.children)
    if (child.type === 'element') dropEmbedsWithoutSource(child)
}

const isExternalLink = (href: string): boolean =>
  Option.match(Option.fromNullable(URL.parse(href)), {
    onNone: () => false,
    onSome: (url) =>
      url.protocol.startsWith('http') &&
      !Array.contains(SITE_HOSTS, url.hostname),
  })

function harden(tree: Root): void {
  dropEmbedsWithoutSource(tree)
  for (const element of elements(tree)) {
    const {src, href} = element.properties
    if (element.tagName === 'iframe' && typeof src === 'string') {
      const [, videoId] = YOUTUBE_EMBED.exec(src) ?? []
      element.properties.src = `https://www.youtube-nocookie.com/embed/${videoId}`
    }
    if (
      element.tagName === 'a' &&
      typeof href === 'string' &&
      isExternalLink(href)
    )
      element.properties.rel = ['noopener', 'noreferrer']
  }
}

const processor = unified()
  .use(rehypeParse, {fragment: true})
  .use(rehypeSanitize, schema)
  .use(() => harden)

export function sanitizePostHtml(html: string): Root {
  return processor.runSync(processor.parse(html))
}
