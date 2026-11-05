import {Array, Option, pipe} from 'effect'
import {type Metadata} from 'next'
import {notFound} from 'next/navigation'
import React from 'react'
import {Footer} from '../../../../../src/components/Footer'
import {GlobalStyles} from '../../../../../src/components/GlobalStyles'
import {Navbar} from '../../../../../src/components/Navbar'
import {
  type BlogPost,
  blogPosts,
  findBlogPost,
  formatBlogDate,
  relatedBlogPosts,
} from '../../../../../src/content/blog'
import {renderRichText} from '../../../../../src/content/blogRichText'
import {blog} from '../../../../../src/i18n/blog'
import {
  type Locale,
  locales,
  localizedPath,
  toLocale,
} from '../../../../../src/i18n/locales'
import {pageMetadata} from '../../../../../src/metadata'
import {resolveLocale} from '../../../../../src/pageParams'
import {BlogCard} from '../../../../../src/views/blog/BlogCard'
import {TocLink} from '../../../../../src/views/blog/TocLink'
import '../../../../../src/views/blog/blogPost.css'

interface Props {
  readonly params: Promise<{locale: string; slug: string}>
}

export const dynamicParams = false

export function generateStaticParams({
  params,
}: {
  readonly params: {locale: string}
}): Array<{slug: string}> {
  return pipe(
    toLocale(params.locale),
    Option.match({
      onNone: () => [],
      onSome: (locale) =>
        Array.map(blogPosts(locale), (post) => ({slug: post.slug})),
    })
  )
}

async function resolvePost(
  props: Props
): Promise<{locale: Locale; post: BlogPost}> {
  const locale = await resolveLocale(props)
  const {slug} = await props.params
  return Option.match(findBlogPost(locale, slug), {
    onNone: () => notFound(),
    onSome: (post) => ({locale, post}),
  })
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const {locale, post} = await resolvePost(props)
  const path = `/post/${post.slug}`
  const metadata = pageMetadata({
    locale,
    path,
    title: `${post.title}${blog[locale].postTitleSuffix}`,
    description: post.title,
    image: Option.getOrUndefined(post.image)?.src,
  })
  return {
    ...metadata,
    // Webflow only links the locales the post is published in
    alternates: {
      ...metadata.alternates,
      languages: {
        'x-default': path,
        ...Object.fromEntries(
          Array.map(post.locales, (other) => [
            other,
            localizedPath(other, path),
          ])
        ),
      },
    },
  }
}

// Webflow sends a language's link to its homepage when the post isn't in it
function missingLocalesGoHome(
  postLocales: readonly Locale[]
): Partial<Record<Locale, string>> {
  return pipe(
    locales,
    Array.filter((other) => !Array.contains(postLocales, other)),
    Array.map((other): [Locale, string] => [other, '/']),
    Object.fromEntries
  )
}

export default async function PostPage(
  props: Props
): Promise<React.JSX.Element> {
  const {locale, post} = await resolvePost(props)
  const t = blog[locale]
  const article = renderRichText(post.body)
  const image = Option.getOrUndefined(post.image)
  return (
    <div className="page-wrapper">
      <Navbar
        locale={locale}
        path={`/post/${post.slug}`}
        alternatePaths={missingLocalesGoHome(post.locales)}
      />
      <GlobalStyles />
      <main className="main-wrapper is-light">
        <section className="section is-blog-detail-hero">
          <div className="w-layout-blockcontainer container is-blog-detail w-container">
            <div className="blog-rich-text-wrapper">
              <div className="blog-highlights-off" />
              <div className="card-wrap is-blog-summary">
                <a
                  href={localizedPath(locale, '/blog')}
                  className="button-text w-inline-block"
                >
                  <div>{t.backToBlog}</div>
                </a>
                <h1 className="blog-main-title">{post.title}</h1>
                <div className="blog-info-card">
                  <div className="blog-info-author-wrapper">
                    <div className="blog-info-text">{t.publishedBy}</div>
                  </div>
                  <div className="blog-info-addon-wrapper">
                    <div className="blog-info-text">
                      {formatBlogDate(post.date)}
                    </div>
                    <div className="blog-time-reading-wrapper">
                      <div data-reading-time="true" className="blog-info-text">
                        {article.readingMinutes}
                      </div>
                      <div className="blog-info-text">{t.minRead}</div>
                    </div>
                  </div>
                </div>
                {image ? (
                  <img
                    src={image.src}
                    loading="lazy"
                    alt=""
                    sizes={image.srcSet ? t.mainImageSizes : undefined}
                    srcSet={image.srcSet}
                    className="blog-main-image"
                  />
                ) : null}
                <div className="blog-summary-title-wrapper">
                  <img
                    src="/wf/63088c60442a08324b0046b6_glasses-yellow.webp"
                    loading="lazy"
                    alt=""
                    className="blog-summary-img"
                  />
                  <div className="title-xs">{t.summary}</div>
                </div>
                <div className="blog-perex">{post.summary}</div>
                <div
                  data-toc="true"
                  className="blog-detail-toc-list-wrapper"
                  style={
                    Array.isNonEmptyReadonlyArray(article.toc)
                      ? undefined
                      : {display: 'none'}
                  }
                >
                  <div className="blog-info-text">{t.tableOfContents}</div>
                  {article.toc.map((entry) => (
                    <TocLink key={entry.id} id={entry.id} indent={entry.indent}>
                      {entry.text}
                    </TocLink>
                  ))}
                </div>
              </div>
              <div
                data-toc-content="true"
                className="text-rich-text w-richtext"
              >
                {article.content}
              </div>
            </div>
          </div>
        </section>
      </main>
      <div className="background-dark">
        <section className="section is-blog-related">
          <div className="w-layout-vflex container is-large-gap">
            <h2>{t.relatedArticles}</h2>
            <div className="collection-list-wrapper w-dyn-list">
              <div role="list" className="collection-list is-blog w-dyn-items">
                {relatedBlogPosts(locale, post.slug).map((related) => (
                  <BlogCard key={related.slug} locale={locale} post={related} />
                ))}
              </div>
            </div>
          </div>
        </section>
        <Footer locale={locale} />
      </div>
    </div>
  )
}
