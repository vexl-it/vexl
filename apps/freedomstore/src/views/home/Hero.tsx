import React from 'react'
import {RollTextButton} from '../../components/RollTextButton'
import {type PageCopy} from '../../copy/pageCopy'

const POSTER_URL = '/wf/6841e9e3e7d8132035c97617_BCG_Imgs_1-poster-00001.jpg'

export function Hero({t}: {readonly t: PageCopy<'home'>}): React.JSX.Element {
  return (
    <section
      id="TOP"
      data-progress-nav-anchor=""
      className="section-web is--hero"
    >
      <div className="hero-wrap">
        <div className="heading-wrapping">
          <h1 className="h1">{t('hero.headline')}</h1>
        </div>
        <div className="w-layout-hflex hero-baseline">
          <h4 className="h4">{t('hero.baseline.1')}</h4>
          <img
            src="/wf/6846db73806fe235c9d4c075_star.svg"
            loading="lazy"
            alt=""
            className="icon-star"
          />
          <h4 className="h4">{t('hero.baseline.2')}</h4>
          <img
            src="/wf/6846db73806fe235c9d4c075_star.svg"
            loading="lazy"
            alt=""
            className="icon-star"
          />
          <h4 className="h4">{t('hero.baseline.3')}</h4>
        </div>
        <div className="w-layout-hflex hero-bottom">
          <h6 className="h6 text-black">{t('hero.version')}</h6>
          <a href="#APP2" className="progress-nav__btn w-inline-block">
            <RollTextButton variant="link">{t('hero.discover')}</RollTextButton>
          </a>
        </div>
      </div>

      <div className="hero-wrap its-mobile">
        <h1 className="h1">{t('hero.headlineMobile')}</h1>
        <div className="w-layout-hflex hero-baseline">
          <h4 className="h4">{t('hero.baseline.1')}</h4>
          <h4 className="h4">{t('hero.baseline.2')}</h4>
          <h4 className="h4">{t('hero.baseline.3')}</h4>
        </div>
        <div className="w-layout-hflex hero-bottom">
          <h6 className="h6 text-black">{t('hero.version')}</h6>
          <a href="#APP2" className="progress-nav__btn w-inline-block">
            <RollTextButton variant="link">{t('hero.discover')}</RollTextButton>
          </a>
        </div>
      </div>

      <div className="hero-video">
        <div className="hero-video w-background-video w-background-video-atom">
          <video
            data-bg-video=""
            loop
            muted
            playsInline
            poster={POSTER_URL}
            style={{backgroundImage: `url("${POSTER_URL}")`}}
          >
            <source
              src="/wf/6841e9e3e7d8132035c97617_BCG_Imgs_1-transcode.mp4"
              type="video/mp4"
            />
            <source
              src="/wf/6841e9e3e7d8132035c97617_BCG_Imgs_1-transcode.webm"
              type="video/webm"
            />
          </video>
        </div>
      </div>
    </section>
  )
}
