import {Array, Option, pipe} from 'effect'
import GithubSlugger from 'github-slugger'

export interface MarkdownHeading {
  readonly id: string
  readonly text: string
  readonly depth: number
}

const stripInlineMarkdown = (text: string): string =>
  text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`\\]/g, '')
    .trim()

/** Section headings with the same ids rehype-slug gives them when rendering. */
export function getMarkdownHeadings(
  markdown: string
): readonly MarkdownHeading[] {
  const slugger = new GithubSlugger()
  return pipe(
    markdown.split('\n'),
    Array.filterMap((line) => {
      const match = /^(#{1,6}) (.+)$/.exec(line)
      return match?.[1] === undefined || match[2] === undefined
        ? Option.none()
        : Option.some({
            depth: match[1].length,
            text: stripInlineMarkdown(match[2]),
          })
    }),
    Array.filter(({text}) => text.length > 0),
    Array.map(({depth, text}) => ({id: slugger.slug(text), text, depth}))
  )
}
