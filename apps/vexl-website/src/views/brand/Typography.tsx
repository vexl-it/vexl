import {Array, pipe} from 'effect'
import React from 'react'
import {type BrandCopy, BrandBlock, DownloadList} from './BrandPage'
import {brandAsset} from './sections'

const typefaces = [
  {
    key: 'monument',
    name: 'Monument Extended',
    file: 'monument-extended',
    className: 'is-monument',
    weights: 'Regular 400 · Bold 700',
    styles: ['Thin', 'Light', 'Regular', 'Bold', 'Black'],
  },
  {
    key: 'satoshi',
    name: 'TT Satoshi',
    file: 'tt-satoshi',
    className: 'is-satoshi',
    weights: 'Medium 500 · DemiBold 600',
    styles: ['Regular', 'Medium', 'DemiBold', 'Bold'],
  },
] satisfies ReadonlyArray<{
  key: 'monument' | 'satoshi'
  name: string
  file: string
  className: string
  weights: string
  styles: readonly string[]
}>

export function Typography({t}: {readonly t: BrandCopy}): React.JSX.Element {
  return (
    <>
      {pipe(
        typefaces,
        Array.map((typeface) => (
          <BrandBlock
            key={typeface.key}
            eyebrow={t('typography.brandTypeface')}
            title={typeface.name}
            text={t(`typography.${typeface.key}.text`)}
          >
            <div className="brand-typeface">
              <div className={`brand-specimen ${typeface.className}`}>
                <p className="brand-specimen_large" aria-hidden="true">
                  Aa Gg @#
                </p>
                <p className="brand-specimen_glyphs">
                  <span className="brand-eyebrow">
                    {t('typography.sample')}
                  </span>
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ
                  <br />
                  abcdefghijklmnopqrstuvwxyz
                  <br />
                  0123456789 @#%&?! ěščřžýáíé
                </p>
              </div>
              <dl className="brand-facts">
                <div>
                  <dt>{t('typography.usedFor')}</dt>
                  <dd>{t(`typography.${typeface.key}.usedFor`)}</dd>
                </div>
                <div>
                  <dt>{t('typography.weights')}</dt>
                  <dd>{typeface.weights}</dd>
                </div>
                <div>
                  <dt>{t('typography.files')}</dt>
                  <dd>{Array.join(typeface.styles, ' · ')}</dd>
                </div>
              </dl>
            </div>
            <p className="brand-text is-muted">
              {t('typography.downloadText')}
            </p>
            <DownloadList
              items={[
                {
                  href: brandAsset(`fonts/${typeface.file}-complete.zip`),
                  label: t('typography.complete'),
                },
                ...pipe(
                  typeface.styles,
                  Array.flatMap((style) =>
                    Array.map(['otf', 'ttf'], (format) => ({
                      href: brandAsset(
                        `fonts/${typeface.file}-${style.toLowerCase()}.${format}`
                      ),
                      label: `${style} · ${format.toUpperCase()}`,
                    }))
                  )
                ),
              ]}
            />
          </BrandBlock>
        ))
      )}
    </>
  )
}
