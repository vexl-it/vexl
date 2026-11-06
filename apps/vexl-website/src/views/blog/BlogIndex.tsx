import {Array, Option} from 'effect'
import {type Metadata} from 'next'
import React from 'react'
import {Footer} from '../../components/Footer'
import {GlobalStyles} from '../../components/GlobalStyles'
import {Navbar} from '../../components/Navbar'
import {
  blogPage,
  blogPageCount,
  blogPosts,
  featuredBlogPost,
} from '../../content/blog'
import {type PageCopy, pageCopy} from '../../copy/pageCopy'
import {type Locale, locales, localizedPath} from '../../i18n/locales'
import {pageMetadata} from '../../metadata'
import {BlogCard} from './BlogCard'

/** Page 1 is the blog itself, the rest replace Webflow's `?27a9a69d_page=N`. */
export function blogPagePath(page: number): string {
  return page === 1 ? '/blog' : `/blog/page/${page}`
}

export async function blogIndexMetadata(
  locale: Locale,
  page: number
): Promise<Metadata> {
  const t = pageCopy(locale, 'blog')
  const pageCounts = await Promise.all(
    Array.map(locales, async (other) => blogPageCount(await blogPosts(other)))
  )
  return pageMetadata({
    locale,
    path: blogPagePath(page),
    title: t.text('meta.title'),
    description: t.text('meta.description'),
    publishedLocales: Array.filter(
      locales,
      (_, index) => page <= (pageCounts[index] ?? 0)
    ),
  })
}

function Pagination({
  locale,
  page,
  pageCount,
  t,
}: {
  readonly locale: Locale
  readonly page: number
  readonly pageCount: number
  readonly t: PageCopy<'blog'>
}): React.JSX.Element {
  const href = (target: number): string =>
    localizedPath(locale, blogPagePath(target))
  return (
    <div
      role="navigation"
      {...t.attr('aria-label', 'pagination.label')}
      className="w-pagination-wrapper pagination"
    >
      {page > 1 && (
        <a
          href={href(page - 1)}
          {...t.attr('aria-label', 'pagination.previousLabel')}
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
          <div className="w-inline-block">{t('pagination.previous')}</div>
        </a>
      )}
      {page < pageCount && (
        <a
          href={href(page + 1)}
          {...t.attr('aria-label', 'pagination.nextLabel')}
          className="w-pagination-next primary-button is-button-pagination"
        >
          <div className="w-inline-block">{t('pagination.next')}</div>
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

export async function BlogIndex({
  locale,
  page,
}: {
  readonly locale: Locale
  readonly page: number
}): Promise<React.JSX.Element> {
  const t = pageCopy(locale, 'blog')
  const posts = await blogPosts(locale)
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
              <h1 className="h1 blog">{t('hero.heading')}</h1>
              <div className="text-subtitle">{t('hero.subtitle')}</div>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="w-layout-vflex container is-large-gap">
            <div className="collection-list-wrapper w-dyn-list">
              <div role="list" className="collection-list w-dyn-items">
                {Option.match(featuredBlogPost(posts), {
                  onNone: () => null,
                  onSome: (post) => (
                    <BlogCard locale={locale} post={post} featured />
                  ),
                })}
              </div>
              <div
                role="navigation"
                {...t.attr('aria-label', 'pagination.label')}
                className="w-pagination-wrapper pagination"
              />
            </div>
            <div className="collection-list-wrapper w-dyn-list">
              <div role="list" className="collection-list is-blog w-dyn-items">
                {blogPage(posts, page).map((post) => (
                  <BlogCard key={post.slug} locale={locale} post={post} />
                ))}
              </div>
              <Pagination
                locale={locale}
                page={page}
                pageCount={blogPageCount(posts)}
                t={t}
              />
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  )
}
