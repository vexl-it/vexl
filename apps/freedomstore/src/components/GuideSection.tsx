import React from 'react'
import {type PageCopy} from '../copy/pageCopy'
import {ArrowButton} from './ArrowButton'

export function GuideSection({
  t,
}: {
  readonly t: PageCopy<'shared'>
}): React.JSX.Element {
  return (
    <section id="HOW" data-progress-nav-anchor="" className="section-web">
      <div className="global-wrap">
        <div className="w-layout-hflex heading-section">
          <div className="heading-left">
            <h6 className="h6">{t('guide.sectionNumber')}</h6>
            <h3 className="h3">{t('guide.sectionTitle')}</h3>
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
        <div className="global-wrap no-padding">
          <div className="flex no-bcg">
            <div data-slide-in="" className="guide-card">
              <div className="wrapper vertical gap-36">
                <div className="wrapper space-between">
                  <h6 className="h6 opacity-50">{t('guide.stepLabel')}</h6>
                  <h2 className="display-heading">{t('guide.step1.number')}</h2>
                </div>
                <div className="wrapper vertical">
                  <div className="width-556 gap-1">
                    <h2 className="h2">{t('guide.step1.title')}</h2>
                    <div className="width-400">
                      <p className="text-l opacity-50">
                        {t('guide.step1.text')}
                      </p>
                    </div>
                  </div>
                  <div className="wrapper">
                    <a
                      href="https://altstore.io/download"
                      target="_blank"
                      rel="noreferrer"
                      className="link-block w-inline-block"
                    >
                      <ArrowButton>{t('guide.step1.button')}</ArrowButton>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div
              data-slide-in=""
              data-slide-in-delay="0.152"
              className="guide-card"
            >
              <div className="wrapper vertical gap-36">
                <div className="wrapper space-between">
                  <h6 className="h6 opacity-50">{t('guide.stepLabel')}</h6>
                  <h2 className="display-heading">{t('guide.step2.number')}</h2>
                </div>
                <div className="wrapper vertical">
                  <div className="width-556 gap-1">
                    <h2 className="h2">{t('guide.step2.title')}</h2>
                    <div className="width-400">
                      <p className="text-l opacity-50">
                        {t('guide.step2.text')}
                      </p>
                    </div>
                  </div>
                  <div className="wrapper">
                    <a
                      href="altstore-pal://source?url=https://source.freedomstore.io/"
                      className="link-block"
                    >
                      <ArrowButton>{t('guide.step2.button')}</ArrowButton>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
