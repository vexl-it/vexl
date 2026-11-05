import {Option} from 'effect'
import {type Metadata} from 'next'
import React from 'react'
import {Footer} from '../../components/Footer'
import {GlobalStyles} from '../../components/GlobalStyles'
import {Navbar} from '../../components/Navbar'
import {blogPage, blogPageCount, featuredBlogPost} from '../../content/blog'
import {blog} from '../../i18n/blog'
import {type Locale, localizedPath} from '../../i18n/locales'
import {pageMetadata} from '../../metadata'
import {BlogCard} from './BlogCard'

/** Page 1 is the blog itself, the rest replace Webflow's `?27a9a69d_page=N`. */
export function blogPagePath(page: number): string {
  return page === 1 ? '/blog' : `/blog/page/${page}`
}

export function blogIndexMetadata(locale: Locale, page: number): Metadata {
  const t = blog[locale]
  return pageMetadata({
    locale,
    path: blogPagePath(page),
    title: t.metaTitle,
    description: t.metaDescription,
  })
}

function Pagination({
  locale,
  page,
}: {
  readonly locale: Locale
  readonly page: number
}): React.JSX.Element {
  const t = blog[locale]
  const href = (target: number): string =>
    localizedPath(locale, blogPagePath(target))
  return (
    <div
      role="navigation"
      aria-label="List"
      className="w-pagination-wrapper pagination"
    >
      {page > 1 && (
        <a
          href={href(page - 1)}
          aria-label="Previous Page"
          className="w-pagination-previous primary-button is-button-pagination"
        >
          <svg
            className="w-pagination-previous-icon"
            height="12px"
            width="12px"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 12 12"
            transform="translate(0, 1)"
          >
            <path
              fill="none"
              stroke="currentColor"
              fillRule="evenodd"
              d="M8 10L4 6l4-4"
            />
          </svg>
          <div className="w-inline-block">{t.previous}</div>
        </a>
      )}
      {page < blogPageCount(locale) && (
        <a
          href={href(page + 1)}
          aria-label="Next Page"
          className="w-pagination-next primary-button is-button-pagination"
        >
          <div className="w-inline-block">{t.next}</div>
          <svg
            className="w-pagination-next-icon"
            height="12px"
            width="12px"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 12 12"
            transform="translate(0, 1)"
          >
            <path
              fill="none"
              stroke="currentColor"
              fillRule="evenodd"
              d="M4 2l4 4-4 4"
            />
          </svg>
        </a>
      )}
    </div>
  )
}

export function BlogIndex({
  locale,
  page,
}: {
  readonly locale: Locale
  readonly page: number
}): React.JSX.Element {
  const t = blog[locale]
  return (
    <div className="page-wrapper">
      <Navbar locale={locale} path="/blog" />
      <GlobalStyles />
      <main className="main-wrapper">
        <section className="section is-blog-hero">
          <div className="w-layout-vflex container is-blog">
            <div className="w-layout-hflex blog-hero-wrapper">
              <div className="glasses-wrapper">
                <img
                  src="/wf/63088c60442a08324b0046b6_glasses-yellow.webp"
                  loading="lazy"
                  width={97.5}
                  alt=""
                  className="glasses-image"
                />
              </div>
              <h1 className="h1 blog">{t.heading}</h1>
              <div className="text-subtitle">{t.subtitle}</div>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="w-layout-vflex container is-large-gap">
            <div className="collection-list-wrapper w-dyn-list">
              <div role="list" className="collection-list w-dyn-items">
                {Option.match(featuredBlogPost(locale), {
                  onNone: () => null,
                  onSome: (post) => (
                    <BlogCard locale={locale} post={post} featured />
                  ),
                })}
              </div>
              <div
                role="navigation"
                aria-label="List"
                className="w-pagination-wrapper pagination"
              />
            </div>
            <div className="collection-list-wrapper w-dyn-list">
              <div role="list" className="collection-list is-blog w-dyn-items">
                {blogPage(locale, page).map((post) => (
                  <BlogCard key={post.slug} locale={locale} post={post} />
                ))}
              </div>
              <Pagination locale={locale} page={page} />
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  )
}
