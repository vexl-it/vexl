import {Array} from 'effect'
import React from 'react'
import {type CopyKey} from '../copy/copyFiles'
import {type PageCopy} from '../copy/pageCopy'
import {RollTextButton} from './RollTextButton'

interface NavLinkItem {
  readonly href: string
  readonly labelKey: CopyKey<'shared'>
}

const HOME_NAV_LINKS: readonly NavLinkItem[] = [
  {href: '#APP2', labelKey: 'nav.app'},
  {href: '#HOW', labelKey: 'nav.how'},
  {href: '#VALUES', labelKey: 'nav.values'},
  {href: '#DEVELOPERS', labelKey: 'nav.developers'},
  {href: '#Contact', labelKey: 'nav.contact'},
]

const APPS_NAV_LINKS: readonly NavLinkItem[] = [
  {href: '#APP2', labelKey: 'nav.app'},
  {href: '#HOW', labelKey: 'nav.how'},
  {href: '#DEVELOPERS', labelKey: 'nav.developers'},
  {href: '#Contact', labelKey: 'nav.contact'},
]

export function Navbar({
  t,
  variant,
}: {
  readonly t: PageCopy<'shared'>
  readonly variant: 'home' | 'apps'
}): React.JSX.Element {
  const logoHref = variant === 'home' ? '#TOP' : '/'
  const navLinks = variant === 'home' ? HOME_NAV_LINKS : APPS_NAV_LINKS

  return (
    <>
      <nav className="progress-nav">
        <div className="progress-nav__inner">
          <a href={logoHref} className="progress-nav__logo w-inline-block">
            <img
              src="/wf/6841e8fa09b1fdd658a23b3f_logo.svg"
              loading="lazy"
              {...t.attr('alt', 'nav.logoAlt')}
            />
          </a>
          <div className="progress-nav__wrapper">
            <div data-progress-nav-list="" className="progress-nav__list">
              {Array.map(navLinks, (item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="progress-nav__btn w-inline-block"
                >
                  <RollTextButton variant="link">
                    {t(item.labelKey)}
                  </RollTextButton>
                </a>
              ))}
            </div>
            <a href="#HOW" className="link-block w-inline-block">
              <RollTextButton variant="blue">{t('nav.cta')}</RollTextButton>
            </a>
          </div>
        </div>
        <div className="progress-nav__inner is-mobile">
          <a href={logoHref} className="progress-nav__logo w-inline-block">
            <img
              src="/wf/6841e8fa09b1fdd658a23b3f_logo.svg"
              loading="lazy"
              {...t.attr('alt', 'nav.logoAlt')}
            />
          </a>
          <div className="progress-nav__wrapper">
            <a href="#HOW" className="link-block w-inline-block">
              <RollTextButton variant="blue" className="is-mobile">
                {t('nav.ctaMobile')}
              </RollTextButton>
            </a>
          </div>
        </div>
      </nav>
      <div className="progress-bar-wrap">
        <div className="progress-bar" />
      </div>
    </>
  )
}
