import React from 'react'
import {type BrandCopy} from './BrandPage'
import {brandAsset} from './sections'

export function Help({t}: {readonly t: BrandCopy}): React.JSX.Element {
  return (
    <section className="container is-base-pading brand-block">
      <div className="brand-help">
        <img
          src={brandAsset('logos/vexl-symbol-black.svg')}
          alt=""
          className="brand-help_glasses"
        />
        <h2 className="h3 is-black">{t('help.contact.title')}</h2>
        <p className="brand-text">{t('help.contact.text')}</p>
        <a href="mailto:support@vexl.it" className="brand-help_button">
          {t('help.contact.button')}
        </a>
      </div>
    </section>
  )
}
