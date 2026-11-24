import {Array, pipe} from 'effect'
import React from 'react'
import {type Locale, localizedPath} from '../../i18n/locales'
import {
  BrandBlock,
  type BrandCopy,
  DownloadList,
  Gallery,
  type GalleryImage,
} from './BrandPage'
import {brandAsset} from './sections'

type ScreenAlt =
  | 'marketplace'
  | 'filters'
  | 'offerDetail'
  | 'commonFriends'
  | 'createOffer'
  | 'offerReach'
  | 'chatList'
  | 'tradeChecklist'
  | 'account'
  | 'contacts'

const screens = [
  {file: 'marketplace', alt: 'marketplace'},
  {file: 'filters', alt: 'filters'},
  {file: 'offer-detail', alt: 'offerDetail'},
  {file: 'common-friends', alt: 'commonFriends'},
  {file: 'create-offer', alt: 'createOffer'},
  {file: 'offer-reach', alt: 'offerReach'},
  {file: 'chat-list', alt: 'chatList'},
  {file: 'trade-checklist', alt: 'tradeChecklist'},
  {file: 'account', alt: 'account'},
  {file: 'contacts', alt: 'contacts'},
] satisfies ReadonlyArray<{file: string; alt: ScreenAlt}>

const themes = ['light', 'dark'] as const

const appImage = (file: string, alt: string): GalleryImage => ({
  src: brandAsset(`application/vexl-app-${file}.webp`),
  download: brandAsset(`application/vexl-app-${file}.png`),
  alt,
})

export const appHero = (t: BrandCopy): GalleryImage =>
  appImage('hero', t.text('application.alt.hero'))

export function ApplicationExamples({
  locale,
  t,
}: {
  readonly locale: Locale
  readonly t: BrandCopy
}): React.JSX.Element {
  return (
    <>
      <BrandBlock
        title={t('application.app.title')}
        text={t('application.app.text')}
        aside={
          <div className="brand-actions">
            <a
              href={localizedPath(locale, '/download')}
              className="button round w-inline-block"
            >
              {t('application.download')}
            </a>
            <a
              href={localizedPath(locale, '/download-noneu')}
              className="secondary-button"
            >
              {t('application.downloadNonEu')}
            </a>
          </div>
        }
      >
        <Gallery variant="hero" images={[appHero(t)]} />
        <DownloadList
          items={[
            {
              href: brandAsset('application/vexl-app-screens.zip'),
              label: t('application.downloadAll'),
            },
          ]}
        />
      </BrandBlock>
      {pipe(
        themes,
        Array.map((theme) => (
          <BrandBlock
            key={theme}
            title={t(`application.${theme}.title`)}
            text={t(`application.${theme}.text`)}
          >
            <Gallery
              variant="screens"
              images={Array.map(screens, ({file, alt}) =>
                appImage(`${file}-${theme}`, t.text(`application.alt.${alt}`))
              )}
            />
          </BrandBlock>
        ))
      )}
    </>
  )
}
