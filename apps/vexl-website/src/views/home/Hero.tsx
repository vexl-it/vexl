import React from 'react'
import {type HomeMessages} from '../../i18n/home'
import {type Locale, localizedPath} from '../../i18n/locales'
import {QrDownload} from './QrDownload'

export function Hero({
  locale,
  t,
}: {
  readonly locale: Locale
  readonly t: HomeMessages['hero']
}): React.JSX.Element {
  return (
    <div className="section is-hero is-homepage">
      <div className="container is-hero">
        <div className="hero-left">
          <div className="glassses-top">
            <img
              src="/wf/62fb7130b9491eced45079f8_sunglasses.webp"
              loading="lazy"
              width="97.5"
              alt="Vexl glasses"
              className="glasses-image"
            />
          </div>
          <h1 className="h2 is-hero">{t.headline}</h1>
          <p className="p is-hero">{t.text}</p>
          <QrDownload
            isYellow
            scanToDownload={t.scanToDownload}
            arrowHref={localizedPath(locale, '/download')}
            buttonClassName="pink"
            buttonText={t.downloadButton}
          />
        </div>
        <div className="hero-right">
          <div className="hero-image">
            <img
              src="/wf/63173d56dc251e1f8817c821_hero-vexlak-2.webp"
              loading="lazy"
              width="138.5"
              alt=""
              className="hero-vexlak _2"
            />
            <img
              src="/wf/63173d56935a316f1d3b2618_hero-vexlak-1.webp"
              loading="lazy"
              width="138.5"
              alt=""
              className="hero-vexlak"
            />
            <img
              src={t.phoneImage.src}
              loading={t.phoneImage.loading}
              sizes={t.phoneImage.sizes}
              width={t.phoneImage.width}
              alt=""
              srcSet={t.phoneImage.srcSet}
              className="hero-phone"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
