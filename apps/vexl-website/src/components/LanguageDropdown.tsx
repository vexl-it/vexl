'use client'

import {Array, pipe} from 'effect'
import React, {useEffect, useRef, useState} from 'react'
import {type Locale, locales, localizedPath} from '../i18n/locales'
import {rovingFocusIndex} from './rovingFocus'

export function LanguageDropdown({
  locale,
  path,
  alternatePaths = {},
  light,
  labels,
  mobile = false,
  menuOpen = false,
}: {
  readonly locale: Locale
  readonly path: string
  /** Where a language's link goes when the page has no version in it. */
  readonly alternatePaths?: Partial<Record<Locale, string>>
  readonly light: boolean
  readonly labels: Record<Locale, React.ReactNode>
  /** The copy that lives inside the collapsible menu. */
  readonly mobile?: boolean
  /** Whether the navbar's mobile menu is open; the list closes with it. */
  readonly menuOpen?: boolean
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [wasMenuOpen, setWasMenuOpen] = useState(menuOpen)
  if (menuOpen !== wasMenuOpen) {
    setWasMenuOpen(menuOpen)
    if (!menuOpen) setOpen(false)
  }
  const ref = useRef<HTMLDivElement>(null)
  const modifiers = [mobile ? 'mobile' : '', light ? 'is-light' : '']
    .filter(Boolean)
    .join(' ')
  const withModifiers = (className: string): string =>
    modifiers ? `${className} ${modifiers}` : className
  const openClass = open ? ' w--open' : ''

  useEffect(() => {
    if (!open) return
    const closeOnOutsideClick = (event: MouseEvent): void => {
      if (event.target instanceof Node && !ref.current?.contains(event.target))
        setOpen(false)
    }
    document.addEventListener('click', closeOnOutsideClick)
    return () => {
      document.removeEventListener('click', closeOnOutsideClick)
    }
  }, [open])

  const toggle = (): void => {
    setOpen((value) => !value)
  }

  // webflow.js dropdown keys. Closed, arrows stay on the toggle (the page may
  // still scroll). Open, arrows walk the languages and keep bubbling, so in the
  // mobile menu the navbar moves on to its links; Escape closes only the list.
  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
        event.stopPropagation()
      return
    }
    if (event.key === 'Escape') {
      event.stopPropagation()
      setOpen(false)
      ref.current?.querySelector<HTMLElement>('.w-dropdown-toggle')?.focus()
      return
    }
    const links = pipe(
      ref.current?.querySelectorAll<HTMLElement>('.w-dropdown-list a') ?? [],
      Array.fromIterable
    )
    const target = rovingFocusIndex(event.key, links)
    if (target === undefined) return
    event.preventDefault()
    links[target]?.focus()
  }

  return (
    <div
      ref={ref}
      className={`${withModifiers('navbar_link language')} w-dropdown`}
      style={open ? {zIndex: 901} : undefined}
      onKeyDown={onKeyDown}
    >
      <div
        className={`dropdown-toggle w-dropdown-toggle${openClass}`}
        aria-haspopup="menu"
        aria-expanded={open}
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            toggle()
          }
        }}
      >
        <img
          loading="lazy"
          src="/wf/66e87a991d1a8e3cdf7ddc83_Language.svg"
          alt=""
          className={`image-21 globe${light ? ' is-light' : ''}`}
        />
        <img
          loading="lazy"
          src="/wf/66e5406cdba3e95e0b21f56d_Chevron.svg"
          alt=""
          className={`image-21${light ? ' is-light' : ''}`}
        />
      </div>
      <nav className={`dropdown-list w-dropdown-list${openClass}`}>
        <div className="locales-wrapper w-locales-list">
          <div role="list" className="locales-list w-locales-items">
            {locales.map((language) => {
              const current = language === locale
              return (
                <div
                  key={language}
                  role="listitem"
                  className={`${mobile ? 'locale ' : ''}w-locales-item`}
                >
                  <a
                    hrefLang={language}
                    href={localizedPath(
                      language,
                      alternatePaths[language] ?? path
                    )}
                    {...(current ? {'aria-current': 'page'} : {})}
                    className={`${withModifiers('link')}${current ? ' w--current' : ''}`}
                  >
                    {labels[language]}
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
