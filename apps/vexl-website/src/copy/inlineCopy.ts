import {Array, Either, pipe, Schema} from 'effect'

/**
 * The only markup copy values may contain: `**bold**`, `*italic*`,
 * `[text](href)` and a newline for a line break.
 */
export type InlineNode =
  | {readonly type: 'text'; readonly text: string}
  | {readonly type: 'break'}
  | {readonly type: 'strong'; readonly children: readonly InlineNode[]}
  | {readonly type: 'em'; readonly children: readonly InlineNode[]}
  | {
      readonly type: 'link'
      readonly href: string
      readonly children: readonly InlineNode[]
    }

export class InlineCopyError extends Schema.TaggedError<InlineCopyError>()(
  'InlineCopyError',
  {message: Schema.String}
) {}

const ALLOWED_HREF = /^(?:https?:\/\/\S+|mailto:\S+|\/(?!\/)\S*)$/
const LOOKS_LIKE_HTML = /<[a-z/!?]/i

export const isExternalHref = (href: string): boolean => /^https?:/.test(href)

// The closing `*` of an italic run, skipping any `**` of bold text inside it
function italicEnd(source: string, from: number): number {
  for (let index = from; index < source.length; index++) {
    if (source[index] !== '*') continue
    if (source[index + 1] === '*') index++
    else return index
  }
  return -1
}

function parseNodes(source: string, inLink: boolean): InlineNode[] {
  const nodes: InlineNode[] = []
  let text = ''
  const pushText = (): void => {
    if (text !== '') nodes.push({type: 'text', text})
    text = ''
  }
  const pushChildren = (
    node: (children: readonly InlineNode[]) => InlineNode,
    inner: string,
    what: string
  ): void => {
    if (inner.trim() === '')
      throw new InlineCopyError({message: `Empty ${what}`})
    pushText()
    nodes.push(node(parseNodes(inner, inLink)))
  }

  let index = 0
  while (index < source.length) {
    if (source.startsWith('**', index)) {
      const end = source.indexOf('**', index + 2)
      if (end < 0)
        throw new InlineCopyError({
          message: 'Bold text is missing its closing **',
        })
      pushChildren(
        (children) => ({type: 'strong', children}),
        source.slice(index + 2, end),
        'bold text'
      )
      index = end + 2
    } else if (source[index] === '*') {
      const end = italicEnd(source, index + 1)
      if (end < 0)
        throw new InlineCopyError({
          message: 'Italic text is missing its closing *',
        })
      pushChildren(
        (children) => ({type: 'em', children}),
        source.slice(index + 1, end),
        'italic text'
      )
      index = end + 1
    } else if (source[index] === '[') {
      if (inLink)
        throw new InlineCopyError({message: 'A link cannot contain a link'})
      const textEnd = source.indexOf('](', index + 1)
      const hrefEnd = textEnd < 0 ? -1 : source.indexOf(')', textEnd + 2)
      if (hrefEnd < 0)
        throw new InlineCopyError({
          message: 'A link must look like [text](https://…)',
        })
      const href = source.slice(textEnd + 2, hrefEnd)
      if (!ALLOWED_HREF.test(href))
        throw new InlineCopyError({
          message: `Links must start with https://, http://, mailto: or /, not "${href}"`,
        })
      const inner = source.slice(index + 1, textEnd)
      if (inner.trim() === '')
        throw new InlineCopyError({message: 'Empty link text'})
      pushText()
      nodes.push({type: 'link', href, children: parseNodes(inner, true)})
      index = hrefEnd + 1
    } else if (source[index] === '\n') {
      pushText()
      nodes.push({type: 'break'})
      index++
    } else {
      text += source[index]
      index++
    }
  }
  pushText()
  return nodes
}

export function parseInlineCopy(
  source: string
): Either.Either<readonly InlineNode[], InlineCopyError> {
  if (source.trim() === '')
    return Either.left(new InlineCopyError({message: 'Copy cannot be empty'}))
  if (LOOKS_LIKE_HTML.test(source))
    return Either.left(
      new InlineCopyError({
        message:
          'HTML is not allowed; use **bold**, *italic*, [text](link) or a new line',
      })
    )
  return Either.try({
    try: () => parseNodes(source, false),
    catch: (error) =>
      error instanceof InlineCopyError
        ? error
        : new InlineCopyError({message: String(error)}),
  })
}

/** A copy value: not empty and only the inline format. */
export const CopyText = Schema.String.pipe(
  Schema.filter((source) =>
    Either.match(parseInlineCopy(source), {
      onLeft: (error) => error.message,
      onRight: () => true,
    })
  )
)

function nodesToPlainText(nodes: readonly InlineNode[]): string {
  return pipe(
    nodes,
    Array.map((node) => {
      if (node.type === 'text') return node.text
      if (node.type === 'break') return '\n'
      return nodesToPlainText(node.children)
    }),
    Array.join('')
  )
}

/** The text without its markup, for titles, attributes and structured data. */
export function inlineCopyToPlainText(source: string): string {
  return Either.match(parseInlineCopy(source), {
    onLeft: () => source,
    onRight: nodesToPlainText,
  })
}
