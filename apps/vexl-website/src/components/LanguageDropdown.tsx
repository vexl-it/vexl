'use client'

import React, {useEffect, useRef, useState} from 'react'
import {type Locale, localizedPath} from '../i18n/locales'

const languages = [
  {locale: 'en', label: 'English'},
  {locale: 'cs', label: 'Czech'},
] as const

export function LanguageDropdown({
  locale,
  path,
  light,
  mobile = false,
}: {
  readonly locale: Locale
  readonly path: string
  readonly light: boolean
  /** The copy that lives inside the collapsible menu. */
  readonly mobile?: boolean
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
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

  return (
    <div
      ref={ref}
      className={`${withModifiers('navbar_link language')} w-dropdown`}
      style={open ? {zIndex: 901} : undefined}
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
            {languages.map((language) => {
              const current = language.locale === locale
              return (
                <div
                  key={language.locale}
                  role="listitem"
                  className={`${mobile ? 'locale ' : ''}w-locales-item`}
                >
                  <a
                    hrefLang={language.locale}
                    href={localizedPath(language.locale, path)}
                    {...(current ? {'aria-current': 'page'} : {})}
                    className={`${withModifiers('link')}${current ? ' w--current' : ''}`}
                  >
                    {language.label}
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
