import {Array, pipe} from 'effect'
import React from 'react'
import {ArrowIcon} from '../../components/ArrowIcon'
import {type Locale, localizedPath} from '../../i18n/locales'
import {type BrandCopy, BrandBlock} from './BrandPage'
import {brandPath, brandSections, cardTones} from './sections'

export function BrandHub({
  locale,
  t,
}: {
  readonly locale: Locale
  readonly t: BrandCopy
}): React.JSX.Element {
  return (
    <>
      <BrandBlock title={t('hub.explore')} text={t('hub.exploreText')}>
        <ul className="brand-cards">
          {pipe(
            brandSections,
            Array.map((section, index) => (
              <li key={section}>
                <a
                  href={localizedPath(locale, brandPath(section))}
                  className={`brand-card is-${cardTones[index % cardTones.length]}`}
                >
                  <span className="brand-card_number">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="brand-card_body">
                    <span className="h3 brand-card_title">
                      {t(`${section}.title`)}
                    </span>
                    <span className="brand-card_text">
                      {t(`${section}.summary`)}
                    </span>
                  </span>
                  <ArrowIcon className="brand-card_arrow" />
                </a>
              </li>
            ))
          )}
        </ul>
      </BrandBlock>
      <section className="container is-base-pading brand-block">
        <p className="brand-eyebrow">{t('hub.rule.eyebrow')}</p>
        <p className="h2 brand-rule">
          {t('hub.rule.human')}
          <br />
          {t('hub.rule.private')}
          <br />
          {t('hub.rule.vexl')}
        </p>
      </section>
    </>
  )
}
