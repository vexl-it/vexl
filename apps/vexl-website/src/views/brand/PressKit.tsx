import {Array, pipe} from 'effect'
import React from 'react'
import {type Locale, localizedPath} from '../../i18n/locales'
import {type BrandCopy, BrandBlock} from './BrandPage'
import {type BrandSection, brandPath} from './sections'

const statement = ['p1', 'p2', 'p3', 'p4', 'p5'] as const

const assetSections: readonly BrandSection[] = [
  'logos',
  'application-examples',
  'people',
  'branding-samples',
]

export function PressKit({
  locale,
  t,
}: {
  readonly locale: Locale
  readonly t: BrandCopy
}): React.JSX.Element {
  return (
    <>
      <BrandBlock
        eyebrow={t('press.statement.eyebrow')}
        title={t('press.statement.title')}
      >
        <div className="brand-statement">
          {pipe(
            statement,
            Array.map((paragraph) => (
              <p key={paragraph} className="brand-text">
                {t(`press.statement.${paragraph}`)}
              </p>
            ))
          )}
        </div>
      </BrandBlock>
      <BrandBlock
        eyebrow={t('press.assets.eyebrow')}
        title={t('press.assets.title')}
        text={t('press.assets.text')}
      >
        <nav className="brand-actions">
          {pipe(
            assetSections,
            Array.map((section) => (
              <a
                key={section}
                href={localizedPath(locale, brandPath(section))}
                className="secondary-button"
              >
                {t(`${section}.title`)} ↗
              </a>
            ))
          )}
        </nav>
      </BrandBlock>
    </>
  )
}
