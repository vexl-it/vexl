import React from 'react'
import {ArrowIcon} from '../../components/ArrowIcon'
import {type PageCopy} from '../../copy/pageCopy'

export function Navbar({t}: {readonly t: PageCopy<'home'>}): React.JSX.Element {
  return (
    <nav className="navbar">
      <div className="navbarbody is-nav">
        <a
          href="/"
          aria-current="page"
          className="vexl-logo w-inline-block w--current"
        >
          <img
            src="/wf/64623e351d6b7819959c110c_Vexl-found-white-on-transparent.svg"
            loading="lazy"
            {...t.attr('alt', 'nav.logoAlt')}
            className="vexl-logo_image"
          />
        </a>
        <div className="controls">
          <div className="controls-copy">
            <p className="p white _1-2">{t('nav.ftiLabel')}</p>
            <a
              href="https://github.com/vexl-it/fti"
              target="_blank"
              rel="noreferrer"
              className="button download outlined w-button"
            >
              {t('nav.ftiDownload')}
            </a>
          </div>
          <div className="controls-copy">
            <a
              href="https://vexl.it/"
              target="_blank"
              rel="noreferrer"
              className="navlink w-inline-block"
            >
              <ArrowIcon className="is-white" />
              <p className="p2 link">{t('nav.vexlLink')}</p>
            </a>
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
            <a
              href="https://donate.vexl.foundation/"
              className="button download w-button"
            >
              {t('nav.donate')}
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
