'use client'

import React, {useEffect, useLayoutEffect, useRef, useState} from 'react'
import {chrome} from '../i18n/chrome'
import {type Locale, localizedPath} from '../i18n/locales'
import {LanguageDropdown} from './LanguageDropdown'

// Webflow's data-collapse="medium" breakpoint
const COLLAPSE_QUERY = '(max-width: 991px)'
// Webflow's data-duration="400" with "ease" easing
const MENU_TRANSITION = 'transform 400ms ease'

type MenuState = 'closed' | 'open' | 'closing'

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
  const t = chrome[locale]
  const light = variant === 'light'
  const withLight = (className: string): string =>
    light ? `${className} is-light` : className
  const [menu, setMenu] = useState<MenuState>('closed')
  const navRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLElement>(null)
  const [overlayHeight, setOverlayHeight] = useState(0)

  const isMenuShown = menu !== 'closed'

  useLayoutEffect(() => {
    const element = menuRef.current
    if (!element || menu === 'closed') return
    const hidden = `translateY(-${element.offsetHeight}px)`
    if (menu === 'open') {
      setOverlayHeight(document.body.scrollHeight)
      element.style.transition = 'none'
      element.style.transform = hidden
      void element.offsetHeight
      element.style.transition = MENU_TRANSITION
      element.style.transform = 'translateY(0px)'
      return
    }
    element.style.transform = hidden
    const timer = setTimeout(() => {
      setMenu('closed')
    }, 400)
    return () => {
      clearTimeout(timer)
    }
  }, [menu])

  useEffect(() => {
    if (menu !== 'open') return
    // Like Webflow's overlay, a click outside the menu only closes it
    const closeOnOutsideClick = (event: MouseEvent): void => {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target) &&
        !navRef.current?.querySelector('.w-nav-button')?.contains(event.target)
      ) {
        event.stopPropagation()
        setMenu('closing')
      }
    }
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      setMenu('closing')
      navRef.current?.querySelector<HTMLElement>('.w-nav-button')?.focus()
    }
    const media = window.matchMedia(COLLAPSE_QUERY)
    const closeOnDesktop = (): void => {
      if (!media.matches) setMenu('closed')
    }
    window.addEventListener('click', closeOnOutsideClick, true)
    window.addEventListener('keydown', closeOnEscape)
    media.addEventListener('change', closeOnDesktop)
    return () => {
      window.removeEventListener('click', closeOnOutsideClick, true)
      window.removeEventListener('keydown', closeOnEscape)
      media.removeEventListener('change', closeOnDesktop)
    }
  }, [menu])

  const toggleMenu = (): void => {
    setMenu((state) => (state === 'open' ? 'closing' : 'open'))
  }

  const navLinkClass = (href: string): string =>
    [
      withLight('navbar_link'),
      'w-nav-link',
      href === path ? 'w--current' : '',
      isMenuShown ? 'w--nav-link-open' : '',
    ]
      .filter(Boolean)
      .join(' ')

  const href = (target: string): string => localizedPath(locale, target)
  const currentProps = (target: string): {'aria-current'?: 'page'} =>
    target === path ? {'aria-current': 'page'} : {}

  const navMenu = (
    <nav
      ref={menuRef}
      role="navigation"
      className={`${withLight('nav-menu')} w-nav-menu`}
      {...(isMenuShown ? {'data-nav-menu-open': ''} : {})}
    >
      <a href={href('/community')} className={navLinkClass('/community')}>
        {t.community}
      </a>
      <a href={href('/blog')} className={navLinkClass('/blog')}>
        {t.blog}
      </a>
      <a href={href('/faq')} className={navLinkClass('/faq')}>
        {t.faq}
      </a>
      <a href="https://www.vexl.foundation/" className={navLinkClass('')}>
        {t.foundation}
      </a>
      <a
        href="https://dashboard.vexl.it"
        target="_blank"
        className={navLinkClass('')}
        rel="noreferrer"
      >
        {t.leaderboard}
      </a>
      <LanguageDropdown
        locale={locale}
        path={path}
        alternatePaths={alternatePaths}
        light={light}
        mobile
      />
    </nav>
  )

  return (
    <div
      ref={navRef}
      data-animation="default"
      data-collapse="medium"
      role="banner"
      className={`${withLight('navbar-2')} w-nav`}
    >
      <div className="container container-navbar w-container">
        <a
          href={href('/')}
          {...currentProps('/')}
          className={`vexl-logo w-inline-block${path === '/' ? ' w--current' : ''}`}
        >
          <img
            src="/wf/630ce8cf1eac16c1831aa9d0_vexl-logo.png"
            loading="lazy"
            alt="eeee"
            className={withLight('vexl-logo_image')}
          />
        </a>
        <div className="div-block-60">{isMenuShown ? null : navMenu}</div>
        <div className="div-block-59">
          <LanguageDropdown
            locale={locale}
            path={path}
            alternatePaths={alternatePaths}
            light={light}
          />
          {light ? null : (
            <a
              href={href('/download')}
              className="button download header w-button"
            >
              {t.download}
            </a>
          )}
          <div
            className={`${withLight('menu-button')} w-nav-button${menu === 'open' ? ' w--open' : ''}`}
            data-animated-icon={light ? undefined : ''}
            aria-label="menu"
            role="button"
            tabIndex={0}
            aria-haspopup="menu"
            aria-expanded={menu === 'open'}
            onClick={toggleMenu}
            onKeyDown={(event) => {
              // Like webflow.js, arrows on the button don't scroll the page
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
                event.preventDefault()
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                toggleMenu()
              }
            }}
          >
            <div className="icon-3 w-icon-nav-menu" />
            <div className="menu_wrapper">
              <div className={withLight('top')} />
              <div className={withLight('mid')} />
              <div className={withLight('bot')} />
            </div>
          </div>
        </div>
      </div>
      <div
        className="w-nav-overlay"
        style={
          isMenuShown ? {height: overlayHeight, display: 'block'} : undefined
        }
      >
        {isMenuShown ? navMenu : null}
      </div>
    </div>
  )
}
