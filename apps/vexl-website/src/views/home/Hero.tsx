import React from 'react'
import {type PageCopy} from '../../copy/pageCopy'
import {type Locale, localizedPath} from '../../i18n/locales'
import {QrDownload} from './QrDownload'

interface PhoneImage {
  readonly src: string
  readonly srcSet?: string
  readonly sizes?: string
  readonly width?: number
  readonly loading?: 'lazy'
}

// The live Czech page still shows the older screenshot
const phoneImages: Record<Locale, PhoneImage> = {
  en: {
    src: '/wf/6a1049661859ee47d0bf75d5_hp_hero.webp',
    sizes: '(max-width: 1919px) 100vw, 1400px',
    width: 1479,
    srcSet:
      '/wf/6a1049661859ee47d0bf75d5_hp_hero-p-500.webp 500w, /wf/6a1049661859ee47d0bf75d5_hp_hero-p-800.webp 800w, /wf/6a1049661859ee47d0bf75d5_hp_hero-p-1080.webp 1080w, /wf/6a1049661859ee47d0bf75d5_hp_hero.webp 1089w',
  },
  cs: {
    src: '/wf/66e2cc20b9c4af13f929b651_Frame-2-kopie-2-.png',
    loading: 'lazy',
  },
}

export function Hero({
  locale,
  t,
}: {
  readonly locale: Locale
  readonly t: PageCopy<'home'>
}): React.JSX.Element {
  const phoneImage = phoneImages[locale]
  return (
    <div className="section is-hero is-homepage">
      <div className="container is-hero">
        <div className="hero-left">
          <div className="glassses-top">
            <img
              src="/wf/62fb7130b9491eced45079f8_sunglasses.webp"
              loading="lazy"
              width="97.5"
              {...t.attr('alt', 'hero.glassesAlt')}
              className="glasses-image"
            />
          </div>
          <h1 className="h2 is-hero">{t('hero.headline')}</h1>
          <p className="p is-hero">{t('hero.text')}</p>
          <QrDownload
            isYellow
            scanToDownload={t('hero.scanToDownload')}
            arrowHref={localizedPath(locale, '/download')}
            buttonClassName="pink"
            buttonText={t('hero.downloadButton')}
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
              src={phoneImage.src}
              loading={phoneImage.loading}
              sizes={phoneImage.sizes}
              width={phoneImage.width}
              alt=""
              srcSet={phoneImage.srcSet}
              className="hero-phone"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
