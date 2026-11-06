import React from 'react'
import {pageCopy} from '../copy/pageCopy'
import {type Locale} from '../i18n/locales'
import {NavbarMenu} from './NavbarMenu'

export function Navbar({
  locale,
  path,
  alternatePaths,
  variant = 'dark',
}: {
  readonly locale: Locale
  /** The current page's path without the locale prefix, e.g. `/faq`. */
  readonly path: string
  /** Where a language's link goes when the page has no version in it. */
  readonly alternatePaths?: Partial<Record<Locale, string>>
  readonly variant?: 'dark' | 'light'
}): React.JSX.Element {
  const t = pageCopy(locale, 'shared')
  return (
    <NavbarMenu
      locale={locale}
      path={path}
      alternatePaths={alternatePaths}
      variant={variant}
      t={{
        community: t('nav.community'),
        blog: t('nav.blog'),
        faq: t('nav.faq'),
        foundation: t('nav.foundation'),
        leaderboard: t('nav.leaderboard'),
        download: t('nav.download'),
        logo: t.attr('alt', 'nav.logoAlt'),
        menuButton: t.attr('aria-label', 'nav.menuLabel'),
        languages: {en: t('nav.language.en'), cs: t('nav.language.cs')},
      }}
    />
  )
}
