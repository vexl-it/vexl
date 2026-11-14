import React from 'react'
import {pageCopy} from '../../copy/pageCopy'
import {type Locale, localizedPath} from '../../i18n/locales'

/** The header the older pages (audit, terms) still use instead of the Navbar. */
export function OldNav({locale}: {readonly locale: Locale}): React.JSX.Element {
  const t = pageCopy(locale, 'shared')
  return (
    <nav className="nav">
      <div className="container is-nav">
        <a
          href={localizedPath(locale, '/')}
          className="vexl-logo w-inline-block"
        >
          <img
            src="/wf/630ce8cf1eac16c1831aa9d0_vexl-logo.png"
            loading="lazy"
            alt=""
            className="vexl-logo_image"
          />
        </a>
        <div className="w-layout-hflex flex-block-3">
          <a
            href={localizedPath(locale, '/download')}
            className="button meetups w-button"
          >
            {t('oldNav.meetups')}
          </a>
          <a
            href="https://vexl.it/download"
            className="button download w-button"
          >
            {t('oldNav.download')}
          </a>
        </div>
      </div>
    </nav>
  )
}
