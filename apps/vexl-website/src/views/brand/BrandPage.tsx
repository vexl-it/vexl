import {Array, pipe} from 'effect'
import {type Metadata} from 'next'
import React from 'react'
import {Footer} from '../../components/Footer'
import {GlobalStyles} from '../../components/GlobalStyles'
import {Navbar} from '../../components/Navbar'
import {type PageCopy, pageCopy} from '../../copy/pageCopy'
import {type Locale, localizedPath} from '../../i18n/locales'
import {pageMetadata} from '../../metadata'
import './brand.css'
import {type BrandSection, brandPath, brandSections} from './sections'

export type BrandCopy = PageCopy<'brand'>

export function brandMetadata(
  locale: Locale,
  section?: BrandSection
): Metadata {
  const t = pageCopy(locale, 'brand')
  return pageMetadata({
    locale,
    path: brandPath(section),
    title:
      section === undefined
        ? t.text('meta.title')
        : `${t.text(`${section}.title`)} · ${t.text('meta.title')}`,
    description:
      section === undefined
        ? t.text('meta.description')
        : t.text(`${section}.summary`),
  })
}

function BrandNav({
  locale,
  current,
  t,
}: {
  readonly locale: Locale
  readonly current?: BrandSection
  readonly t: BrandCopy
}): React.JSX.Element {
  return (
    <nav className="brand-nav" {...t.attr('aria-label', 'navLabel')}>
      {pipe(
        brandSections,
        Array.map((section) => (
          <a
            key={section}
            href={localizedPath(locale, brandPath(section))}
            aria-current={section === current ? 'page' : undefined}
            className="brand-nav_link"
          >
            {t(`${section}.title`)}
          </a>
        ))
      )}
    </nav>
  )
}

/** Navbar, title, section menu and footer every brand manual page shares. */
export function BrandPage({
  locale,
  section,
  title,
  text,
  children,
}: {
  readonly locale: Locale
  readonly section?: BrandSection
  readonly title: React.ReactNode
  readonly text: React.ReactNode
  readonly children: React.ReactNode
}): React.JSX.Element {
  const t = pageCopy(locale, 'brand')
  return (
    <div className="page-wrapper">
      <GlobalStyles />
      <Navbar locale={locale} path={brandPath(section)} />
      <main className="main-wrapper brand-main">
        <header className="container is-base-pading brand-header">
          {section === undefined ? (
            <p className="brand-eyebrow">{t('manual')}</p>
          ) : (
            <a
              href={localizedPath(locale, brandPath())}
              className="brand-eyebrow"
            >
              {t('manual')}
            </a>
          )}
          <h1 className="h1 brand-title">{title}</h1>
          <p className="brand-lead">{text}</p>
          <BrandNav locale={locale} current={section} t={t} />
        </header>
        {children}
      </main>
      <Footer locale={locale} />
    </div>
  )
}

/** One titled part of a brand page, its title beside or above the content. */
export function BrandBlock({
  eyebrow,
  title,
  text,
  aside,
  children,
}: {
  readonly eyebrow?: React.ReactNode
  readonly title: React.ReactNode
  readonly text?: React.ReactNode
  readonly aside?: React.ReactNode
  readonly children?: React.ReactNode
}): React.JSX.Element {
  return (
    <section className="container is-base-pading brand-block">
      <div className="brand-block_head">
        <div>
          {eyebrow === undefined ? null : (
            <p className="brand-eyebrow">{eyebrow}</p>
          )}
          <h2 className="h3 brand-block_title">{title}</h2>
        </div>
        {text === undefined && aside === undefined ? null : (
          <div className="brand-block_text">
            {text === undefined ? null : <p className="brand-text">{text}</p>}
            {aside}
          </div>
        )}
      </div>
      {children}
    </section>
  )
}

export interface Download {
  readonly href: string
  readonly label: React.ReactNode
}

export function DownloadList({
  items,
}: {
  readonly items: readonly Download[]
}): React.JSX.Element {
  return (
    <ul className="brand-downloads">
      {pipe(
        items,
        Array.map((item) => (
          <li key={item.href}>
            <a href={item.href} download className="brand-download">
              <span>{item.label}</span>
              <span aria-hidden="true">↓</span>
            </a>
          </li>
        ))
      )}
    </ul>
  )
}

export interface GalleryImage {
  readonly src: string
  readonly alt: string
  /** A full-size file to download instead of the shown `src` */
  readonly download?: string
}

/** Images that open full size and can be downloaded. */
export function Gallery({
  images,
  variant,
}: {
  readonly images: readonly GalleryImage[]
  readonly variant?: 'avatars' | 'photos' | 'screens' | 'hero'
}): React.JSX.Element {
  return (
    <ul
      className={`brand-gallery${variant === undefined ? '' : ` is-${variant}`}`}
    >
      {pipe(
        images,
        Array.map((image) => (
          <li key={image.src}>
            <a
              href={image.download ?? image.src}
              download
              className="brand-gallery_item"
            >
              <img src={image.src} alt={image.alt} loading="lazy" />
              <span className="brand-gallery_download" aria-hidden="true">
                ↓
              </span>
            </a>
          </li>
        ))
      )}
    </ul>
  )
}
