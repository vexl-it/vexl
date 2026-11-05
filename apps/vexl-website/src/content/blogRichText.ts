import {Array, Order, pipe} from 'effect'
import {type Element, type Nodes, type Root} from 'hast'
import {type ReactElement} from 'react'
import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

export interface TocEntry {
  readonly id: string
  readonly text: string
  /** Indentation by heading level, as the live table-of-contents script did. */
  readonly indent: string
}

export interface RichText {
  readonly content: ReactElement
  readonly toc: readonly TocEntry[]
  readonly readingMinutes: number
}

const TOC_HEADINGS = ['h2', 'h3', 'h4']
const BLOCKS = new Set(['p', 'li', 'blockquote', 'figure', 'figcaption', 'div'])

const isWhitespace = (node: Nodes): boolean =>
  node.type === 'text' && node.value.trim() === ''

function elements(node: Root | Element): Element[] {
  return pipe(
    node.children,
    Array.flatMap((child) =>
      child.type === 'element' ? [child, ...elements(child)] : []
    )
  )
}

function textContent(node: Nodes): string {
  if (node.type === 'text') return node.value
  if (node.type !== 'element' && node.type !== 'root') return ''
  return pipe(node.children, Array.map(textContent), Array.join(''))
}

/** The text as the browser's innerText splits it into words. */
function readableText(node: Nodes): string {
  if (node.type === 'text') return node.value
  if (node.type !== 'element' && node.type !== 'root') return ''
  if (node.type === 'element' && node.tagName === 'br') return '\n'
  const text = pipe(node.children, Array.map(readableText), Array.join(''))
  const isBlock =
    node.type === 'element' &&
    (BLOCKS.has(node.tagName) || /^h[1-6]$/.test(node.tagName))
  return isBlock ? `\n${text}\n` : text
}

/** What the live reading-time script counted: words with a letter or digit, 200 a minute. */
function readingMinutes(tree: Root): number {
  const words = pipe(
    readableText(tree).trim().split(/\s+/),
    Array.filter((word) => /[\p{L}\p{N}]/u.test(word))
  )
  return Math.max(1, Math.ceil(words.length / 200))
}

/**
 * Brings markdown output in line with Webflow's rich text: no whitespace
 * between blocks, `role="list"` on lists, and `toc-N` ids on the headings the
 * table of contents links to.
 */
function analyze(tree: Root): Omit<RichText, 'content'> {
  tree.children = Array.filter(tree.children, (child) => !isWhitespace(child))
  const all = elements(tree)
  for (const list of all) {
    if (list.tagName !== 'ul' && list.tagName !== 'ol') continue
    list.properties.role ??= 'list'
    list.children = Array.filter(list.children, (child) => !isWhitespace(child))
  }
  const headings = Array.filter(all, (element) =>
    Array.contains(TOC_HEADINGS, element.tagName)
  )
  const levels = pipe(
    headings,
    Array.map((heading) => heading.tagName),
    Array.dedupe,
    Array.sort(Order.string)
  )
  const toc = Array.map(headings, (heading, index) => {
    const id = `toc-${index}`
    heading.properties.id = id
    return {
      id,
      text: textContent(heading),
      indent: `${levels.indexOf(heading.tagName) * 20}px`,
    }
  })
  return {toc, readingMinutes: readingMinutes(tree)}
}

export function renderRichText(markdown: string): RichText {
  let result: Omit<RichText, 'content'> = {toc: [], readingMinutes: 1}
  // Markdown renders synchronously, so the plugin has run when it returns.
  const content = Markdown({
    children: markdown,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeRaw,
      () => (tree: Root) => {
        result = analyze(tree)
      },
    ],
  })
  return {content, ...result}
}
