import React from 'react'
import {type PageCopy} from '../../copy/pageCopy'

export function Intro({t}: {readonly t: PageCopy<'home'>}): React.JSX.Element {
  return (
    <div className="intro">
      <div className="div-block-4">
        <a
          href="https://github.com/vexl-it/fti/raw/main/fti.pdf"
          target="_blank"
          rel="noreferrer"
          className="navlink alt w-inline-block"
        >
          <img
            src="/wf/647ce237f2fc3d6e5a612104_PDF.svg"
            loading="lazy"
            alt=""
          />
          <p className="p2">{t('nav.ftiPdf')}</p>
        </a>
      </div>
      <div className="hero-left">
        <div className="glassses-top">
          <img
            src="/wf/646214c4363076eb171c33e1_sunglasses.webp"
            loading="lazy"
            width={97.5}
            alt=""
            className="glasses-image"
          />
        </div>
        <h1 className="h1">{t('hero.headline')}</h1>
      </div>
      <div className="hero-right" />
    </div>
  )
}
