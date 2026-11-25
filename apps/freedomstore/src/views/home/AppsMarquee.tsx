import {Array} from 'effect'
import React from 'react'
import {AppCardContent} from '../../components/AppCardContent'
import {RollTextButton} from '../../components/RollTextButton'
import {type PageCopy} from '../../copy/pageCopy'
import {STORE_APPS} from '../../data/apps'

export function AppsMarquee({
  t,
  shared,
}: {
  readonly t: PageCopy<'home'>
  readonly shared: PageCopy<'shared'>
}): React.JSX.Element {
  return (
    <section id="APP2" className="section-resource">
      <div className="global-wrap its-apd">
        <div className="w-layout-hflex heading-section">
          <div className="heading-left">
            <h6 className="h6">{shared('apps.sectionNumber')}</h6>
            <h3 className="h3">{shared('apps.sectionTitle')}</h3>
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

      <div
        data-marquee-duplicate="10"
        data-marquee-scroll-direction-target=""
        data-marquee-direction="right"
        data-marquee-status="normal"
        data-marquee-speed="15"
        data-marquee-scroll-speed="10"
        className="marquee-advanced"
      >
        <div data-marquee-scroll-target="" className="marquee-advanced__scroll">
          <div
            data-marquee-collection-target=""
            className="marquee-advanced__collection"
          >
            {Array.map(STORE_APPS, (app) => (
              <div key={app.number} className="marquee-advanced__item-width">
                <AppCardContent app={app} t={shared} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <a href="/apps" className="link-block w-inline-block">
        <RollTextButton variant="blue">{t('apps.exploreAll')}</RollTextButton>
      </a>
    </section>
  )
}
