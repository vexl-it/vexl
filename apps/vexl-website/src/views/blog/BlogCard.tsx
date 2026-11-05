import {Option} from 'effect'
import React from 'react'
import {type BlogPost, formatBlogDate} from '../../content/blog'
import {type Locale, localizedPath} from '../../i18n/locales'

// Webflow's "light - horizontal" variant of the blog card component
const FEATURED = 'w-variant-b3461d0f-3d11-9b06-fe0a-22b960aeee4d'

export function BlogCard({
  locale,
  post,
  featured = false,
}: {
  readonly locale: Locale
  readonly post: BlogPost
  readonly featured?: boolean
}): React.JSX.Element {
  const variant = featured ? ` ${FEATURED}` : ''
  const image = Option.getOrUndefined(post.image)
  return (
    <div role="listitem" className="collection-item is-blog w-dyn-item">
      <a
        href={localizedPath(locale, `/post/${post.slug}`)}
        className={`blog-card-wrapper${variant} w-inline-block`}
      >
        <img
          loading="lazy"
          src={image?.src}
          alt=""
          sizes={
            image?.srcSet ? '(max-width: 1919px) 100vw, 1920px' : undefined
          }
          srcSet={image?.srcSet}
          className={`div-block-14${variant}`}
        />
        <div className="div-block-33">
          <h2 className={`h3 blog${variant}`}>{post.title}</h2>
          <h1 className="p-large blog is-gray">{post.summary}</h1>
          <div className={`p-large is-yellow blog${variant}`}>
            {formatBlogDate(post.date)}
          </div>
        </div>
      </a>
    </div>
  )
}
