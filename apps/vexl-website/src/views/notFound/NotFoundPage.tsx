'use client'

import {Option} from 'effect'
import React, {useEffect, useState} from 'react'
import {
  defaultLocale,
  type Locale,
  localizedPath,
  toLocale,
} from '../../i18n/locales'

export interface NotFoundCopy {
  readonly title: string
  readonly description: string
  readonly heading: React.ReactNode
  readonly subtitle: React.ReactNode
  readonly home: React.ReactNode
}

export function NotFoundPage({
  copy,
}: {
  readonly copy: Record<Locale, NotFoundCopy>
}): React.JSX.Element {
  const [locale, setLocale] = useState(defaultLocale)
  useEffect(() => {
    const pathLocale = Option.getOrElse(
      toLocale(window.location.pathname.split('/')[1] ?? ''),
      () => defaultLocale
    )
    document.documentElement.lang = pathLocale
    setLocale(pathLocale)
  }, [])
  const t = copy[locale]
  const home = localizedPath(locale, '/')
  return (
    <div className="utility-page-wrap">
      <title>{t.title}</title>
      <meta name="description" content={t.description} />
      <div className="utility-page-content">
        <div className="glasses-wrapper">
          <img
            src="/wf/63088c60442a08324b0046b6_glasses-yellow.webp"
            loading="lazy"
            width={97.5}
            alt=""
            className="glasses-image"
          />
        </div>
        <h1>{t.heading}</h1>
        <div className="subtitle-404">{t.subtitle}</div>
        <a href={home} className="button w-button">
          {t.home}
        </a>
      </div>
      <div className="w-embed">
        <meta httpEquiv="refresh" content={`2; url=${home}`} />
      </div>
    </div>
  )
}
