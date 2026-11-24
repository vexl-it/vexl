import {Array} from 'effect'
import React from 'react'
import {type Locale, localizedPath} from '../../i18n/locales'
import {
  BrandBlock,
  type BrandCopy,
  Gallery,
  type GalleryImage,
} from './BrandPage'

/** Screens of the current app in `public/wf/brand/application`. */
const screens: readonly GalleryImage[] = []

export function ApplicationExamples({
  locale,
  t,
}: {
  readonly locale: Locale
  readonly t: BrandCopy
}): React.JSX.Element {
  return (
    <BrandBlock
      title={t('application.app.title')}
      text={t(
        Array.isNonEmptyReadonlyArray(screens)
          ? 'application.app.text'
          : 'application.pending'
      )}
    >
      {Array.isNonEmptyReadonlyArray(screens) ? (
        <Gallery images={screens} />
      ) : null}
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
    </BrandBlock>
  )
}
