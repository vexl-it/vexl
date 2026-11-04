import React from 'react'
import ReactMarkdown, {type Components} from 'react-markdown'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import {
  MdBody,
  MdHeading,
  MdImage,
  MdLink,
  MdList,
  MdListItem,
  MdParagraph,
  MdQuote,
  MdRule,
} from './MarkdownElements'

// Runs on the server; `node` is dropped so the hast tree is not serialized to the client.
const components: Components = {
  h1: ({id, children}) => (
    <MdHeading level={1} id={id}>
      {children}
    </MdHeading>
  ),
  h2: ({id, children}) => (
    <MdHeading level={2} id={id}>
      {children}
    </MdHeading>
  ),
  h3: ({id, children}) => (
    <MdHeading level={3} id={id}>
      {children}
    </MdHeading>
  ),
  h4: ({id, children}) => (
    <MdHeading level={4} id={id}>
      {children}
    </MdHeading>
  ),
  h5: ({id, children}) => (
    <MdHeading level={5} id={id}>
      {children}
    </MdHeading>
  ),
  h6: ({id, children}) => (
    <MdHeading level={6} id={id}>
      {children}
    </MdHeading>
  ),
  p: ({children}) => <MdParagraph>{children}</MdParagraph>,
  a: ({href, children}) => <MdLink href={href}>{children}</MdLink>,
  ul: ({children}) => <MdList ordered={false}>{children}</MdList>,
  ol: ({start, children}) => (
    <MdList ordered start={start}>
      {children}
    </MdList>
  ),
  li: ({children}) => <MdListItem>{children}</MdListItem>,
  blockquote: ({children}) => <MdQuote>{children}</MdQuote>,
  img: ({src, alt}) => (
    <MdImage src={typeof src === 'string' ? src : undefined} alt={alt} />
  ),
  hr: () => <MdRule />,
}

export function Markdown({
  children,
}: {
  readonly children: string
}): React.JSX.Element {
  return (
    <MdBody>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </MdBody>
  )
}
