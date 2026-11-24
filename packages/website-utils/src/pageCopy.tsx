import {Array, Either, pipe, Record} from 'effect'
import React from 'react'
import {
  type InlineNode,
  inlineCopyToPlainText,
  isExternalHref,
  parseInlineCopy,
} from './inlineCopy'

/** The dev-only attribute the copy editor finds editable copy by; empty in production. */
export interface CopyMarker {
  readonly 'data-copy'?: string
}

function renderNode(node: InlineNode): React.ReactNode {
  switch (node.type) {
    case 'text':
      return node.text
    case 'break':
      return <br />
    case 'strong':
      return <strong>{renderNodes(node.children)}</strong>
    case 'em':
      return <em>{renderNodes(node.children)}</em>
    case 'link':
      return (
        <a
          href={node.href}
          {...(isExternalHref(node.href)
            ? {target: '_blank', rel: 'noreferrer'}
            : {})}
        >
          {renderNodes(node.children)}
        </a>
      )
  }
}

function renderNodes(nodes: readonly InlineNode[]): React.ReactNode {
  const [only, ...rest] = nodes
  if (only?.type === 'text' && !Array.isNonEmptyArray(rest)) return only.text
  // Spread as arguments, so the nodes need no keys
  return React.createElement(
    React.Fragment,
    null,
    ...Array.map(nodes, renderNode)
  )
}

/** Renders a copy value: plain text stays a string, markup becomes elements. */
export function renderInlineCopy(source: string): React.ReactNode {
  return renderNodes(
    Either.getOrElse(parseInlineCopy(source), () => [
      {type: 'text', text: source},
    ])
  )
}

export interface PageCopy<Key extends string> {
  /** The rendered value; wrapped in a marker span under `next dev`. */
  (key: Key): React.ReactNode
  /** The value without markup, for metadata and attributes. */
  readonly text: (key: Key) => string
  /** The value as stored, for components that split it into blocks. */
  readonly raw: (key: Key) => string
  /** Marks an element whose content is built from `key`'s blocks. */
  readonly marker: (key: Key) => CopyMarker
  /** An attribute such as `alt` holding the value, plus its marker. */
  readonly attr: <Name extends string>(
    name: Name,
    key: Key
  ) => Record<Name, string> & CopyMarker
  readonly keys: readonly Key[]
}

/** One page's copy in one language; `page` is how the copy editor finds it. */
export function createPageCopy<Key extends string>(
  page: string,
  values: Record.ReadonlyRecord<Key, string>
): PageCopy<Key> {
  const raw = (key: Key): string => values[key]
  const marker = (key: Key): CopyMarker =>
    process.env.NODE_ENV === 'development'
      ? {'data-copy': `${page}:${key}`}
      : {}
  const render = (key: Key): React.ReactNode =>
    process.env.NODE_ENV === 'development' ? (
      <span {...marker(key)}>{renderInlineCopy(raw(key))}</span>
    ) : (
      renderInlineCopy(raw(key))
    )
  const text = (key: Key): string => inlineCopyToPlainText(raw(key))
  return Object.assign(render, {
    text,
    raw,
    marker,
    attr: <Name extends string>(name: Name, key: Key) => ({
      ...Record.singleton(name, text(key)),
      ...marker(key),
    }),
    keys: pipe(values, Record.keys),
  })
}
