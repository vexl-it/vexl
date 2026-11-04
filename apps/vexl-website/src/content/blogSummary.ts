import {type BlogPost} from './blog'

export type BlogPostSummary = Omit<BlogPost, 'content'>

/** Drops the Markdown body so list pages don't send every article to the browser. */
export function toSummary({
  content: _content,
  ...summary
}: BlogPost): BlogPostSummary {
  return summary
}
