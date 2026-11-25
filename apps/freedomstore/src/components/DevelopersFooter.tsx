import React from 'react'
import {type PageCopy} from '../copy/pageCopy'
import {ArrowButton} from './ArrowButton'
import {RollTextButton} from './RollTextButton'

export function DevelopersFooter({
  t,
}: {
  readonly t: PageCopy<'shared'>
}): React.JSX.Element {
  return (
    <section
      id="DEVELOPERS"
      data-progress-nav-anchor=""
      className="section-web is--footer"
    >
      <div className="global-wrap its-footer">
        <div className="w-layout-hflex heading-section">
          <div className="heading-left">
            <h6 className="h6">{t('footer.sectionNumber')}</h6>
            <h3 className="h3">{t('footer.sectionTitle')}</h3>
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
        <div className="footer">
          <div className="heading-wrapping aligin-left">
            <h2 className="h1 its-footer">{t('footer.headline1')}</h2>
            <h2 className="h1 its-footer">{t('footer.headline2')}</h2>
          </div>
          <div className="wrapper gap-1 margin-top">
            <p className="text-xxl">{t('footer.subtitle')}</p>
            <a
              href="mailto:developers@freedomstore.io"
              className="link-block w-inline-block"
            >
              <ArrowButton>{t('footer.applyButton')}</ArrowButton>
            </a>
          </div>
          <div id="Contact" className="footer-links-wrapper">
            <a href="#HOW" className="link-block its-footer w-inline-block">
              <span className="button-block-43">
                <img
                  src="/wf/684a94a8b06428e86dc6ca90_freedom.svg"
                  loading="lazy"
                  {...t.attr('alt', 'footer.freedomStoreAlt')}
                  className="footer-icon"
                />
                <span className="button-block-43-overlay" aria-hidden="true" />
              </span>
            </a>
            <a
              href="https://www.vexl.foundation/"
              target="_blank"
              rel="noreferrer"
              className="link-block its-footer w-inline-block"
            >
              <span className="button-block-43">
                <img
                  src="/wf/684a94a81bd0eb5ae72f0a79_vexl.svg"
                  loading="lazy"
                  {...t.attr('alt', 'footer.vexlFoundationAlt')}
                  className="footer-icon"
                />
                <span className="button-block-43-overlay" aria-hidden="true" />
              </span>
            </a>
          </div>
          <div className="footer-links-wrapper no-margin">
            <div className="wrapper gap-2">
              <a href="#" className="link-block w-inline-block">
                <RollTextButton variant="link">
                  {t('footer.twitter')}
                </RollTextButton>
              </a>
            </div>
            <div className="wrapper gap-2">
              <div className="button-text-02">{t('footer.copyright')}</div>
            </div>
            <div className="wrapper gap-2">
              <a
                href="mailto:hello@freedomstore.io"
                className="link-block w-inline-block"
              >
                <RollTextButton variant="link">
                  {t('footer.email')}
                </RollTextButton>
              </a>
            </div>
          </div>
          <p className="footer-privacy">{t('footer.privacy')}</p>
        </div>
      </div>
    </section>
  )
}
