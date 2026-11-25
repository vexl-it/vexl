import React from 'react'
import {type PageCopy} from '../../copy/pageCopy'

export function Values({t}: {readonly t: PageCopy<'home'>}): React.JSX.Element {
  return (
    <section
      id="VALUES"
      data-sticky-title="wrap"
      className="sticky-title-wrapper"
    >
      <div className="sticky-title-container">
        <div className="global-wrap margin-small">
          <div className="w-layout-hflex heading-section">
            <div className="heading-left">
              <h6 className="h6">{t('values.sectionNumber')}</h6>
              <h3 className="h3">{t('values.sectionTitle')}</h3>
            </div>
            <div className="heading-right">
              <img
                src="/wf/6846e718c00fc4c7e01bb21a_symbol.svg"
                loading="lazy"
                alt=""
                className="icon-symbol"
              />
            </div>
          </div>
        </div>
        <div className="sticky-title-inner">
          <h2 data-sticky-title="heading" className="sticky-title-el">
            <span className="text-span-3">{t('values.1.title')}</span>
            <br />
            <br />
            {t('values.1.text')}
          </h2>
          <h2
            data-sticky-title="heading"
            className="sticky-title-el is--stacked"
          >
            <span className="text-span-4">{t('values.2.title')}</span>
            <br />
            <br />
            {t('values.2.text')}
          </h2>
          <h2
            data-sticky-title="heading"
            className="sticky-title-el is--stacked"
          >
            <span className="text-span-5">{t('values.3.title')}</span>
            <br />
            <br />
            {t('values.3.text')}
          </h2>
        </div>
      </div>
    </section>
  )
}
