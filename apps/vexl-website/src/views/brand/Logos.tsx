import {Array, pipe} from 'effect'
import React from 'react'
import {
  type BrandCopy,
  BrandBlock,
  DownloadList,
  ScreenReaderText,
} from './BrandPage'
import {brandAsset} from './sections'

type Version = 'black' | 'white' | 'yellow' | 'twoTone'

const versionFile: Record<Version, string> = {
  black: 'black',
  white: 'white',
  yellow: 'yellow',
  twoTone: 'two-tone',
}

const logos = [
  {
    key: 'main',
    file: 'vexl-logo',
    versions: ['black', 'white', 'yellow'],
    minHeight: {px: 30, mm: 10},
  },
  {
    key: 'symbol',
    file: 'vexl-symbol',
    versions: ['twoTone', 'black', 'white', 'yellow'],
    minHeight: {px: 30, mm: 10},
  },
  {
    key: 'secondary',
    file: 'vexl-secondary-logo',
    versions: ['black', 'white'],
    minHeight: {px: 16, mm: 20},
  },
] satisfies ReadonlyArray<{
  key: 'main' | 'symbol' | 'secondary'
  file: string
  versions: readonly Version[]
  minHeight: {px: number; mm: number}
}>

const logoFile = (file: string, version: Version, extension: string): string =>
  brandAsset(`logos/${file}-${versionFile[version]}.${extension}`)

const isOnLight = (version: Version): boolean =>
  version === 'black' || version === 'twoTone'

const contrastBackgrounds = [
  {color: '#FFFFFF', version: 'black'},
  {color: '#FCCD6C', version: 'black'},
  {color: '#ACD9B7', version: 'black'},
  {color: '#FCC5F3', version: 'black'},
  {color: '#455749', version: 'white'},
  {color: '#000000', version: 'white'},
  {color: '#000000', version: 'yellow'},
] satisfies ReadonlyArray<{color: string; version: Version}>

const misuses = ['shadow', 'rotate', 'recolor', 'deform'] as const

const logoFormats = ['svg', 'png', 'pdf'] as const

export function Logos({t}: {readonly t: BrandCopy}): React.JSX.Element {
  return (
    <>
      {pipe(
        logos,
        Array.map((logo) => (
          <BrandBlock
            key={logo.key}
            id={logo.key}
            title={t(`logos.${logo.key}.name`)}
            text={t(`logos.${logo.key}.text`)}
            aside={
              <p className="brand-text is-muted">
                {t('logos.minHeight')}: {logo.minHeight.px} px{' '}
                {t('logos.onScreens')}, {logo.minHeight.mm} mm{' '}
                {t('logos.inPrint')}
              </p>
            }
          >
            <div className="brand-tiles">
              {pipe(
                logo.versions,
                Array.map((version) => {
                  const name = `${t.text(`logos.${logo.key}.name`)}, ${t.text(`logos.version.${version}`)}`
                  return (
                    <figure
                      key={version}
                      className={`brand-tile ${isOnLight(version) ? 'is-light' : 'is-dark'}`}
                    >
                      <img
                        src={logoFile(logo.file, version, 'svg')}
                        alt={name}
                        className="brand-tile_logo"
                      />
                      <figcaption className="brand-tile_caption">
                        <span className="brand-tile_label">
                          {t(`logos.version.${version}`)}
                        </span>
                        <span className="brand-tile_formats">
                          {pipe(
                            logoFormats,
                            Array.map((format) => (
                              <a
                                key={format}
                                href={logoFile(logo.file, version, format)}
                                download
                              >
                                {format.toUpperCase()}
                                <ScreenReaderText>, {name}</ScreenReaderText> ↓
                              </a>
                            ))
                          )}
                        </span>
                      </figcaption>
                    </figure>
                  )
                })
              )}
            </div>
          </BrandBlock>
        ))
      )}
      <BrandBlock
        id="app-icon"
        title={t('logos.appIcon.name')}
        text={t('logos.appIcon.text')}
      >
        <div className="brand-tiles">
          <figure className="brand-tile is-dark">
            <img
              src={brandAsset('logos/vexl-app-icon.png')}
              alt={t.text('logos.appIcon.name')}
              className="brand-tile_icon"
            />
          </figure>
        </div>
        <DownloadList
          items={[
            {
              href: brandAsset('logos/vexl-app-icon.png'),
              label: `${t.text('logos.appIcon.name')} · PNG`,
            },
            {
              href: brandAsset('logos/vexl-logos.zip'),
              label: t('logos.downloadAll'),
            },
          ]}
        />
      </BrandBlock>
      <BrandBlock title={t('logos.space.title')} text={t('logos.space.text')}>
        <div className="brand-tiles">
          <div className="brand-tile is-light">
            <img
              src={logoFile('vexl-logo', 'black', 'svg')}
              alt=""
              className="brand-tile_logo brand-clear-space"
            />
          </div>
          <div className="brand-tile is-light">
            <img
              src={logoFile('vexl-symbol', 'twoTone', 'svg')}
              alt=""
              className="brand-tile_logo brand-clear-space"
            />
          </div>
        </div>
      </BrandBlock>
      <BrandBlock title={t('logos.avoid.title')}>
        <ol className="brand-misuses">
          {pipe(
            misuses,
            Array.map((misuse) => (
              <li key={misuse} className="brand-misuse">
                <div className="brand-misuse_preview">
                  <img
                    src={logoFile('vexl-logo', 'black', 'svg')}
                    alt=""
                    className={`brand-misuse_logo is-${misuse}`}
                  />
                </div>
                <p className="brand-text">{t(`logos.avoid.${misuse}`)}</p>
              </li>
            ))
          )}
        </ol>
      </BrandBlock>
      <BrandBlock
        title={t('logos.contrast.title')}
        text={t('logos.contrast.text')}
      >
        <div className="brand-contrast">
          {pipe(
            contrastBackgrounds,
            Array.map(({color, version}) => (
              <div
                key={`${color}-${version}`}
                className="brand-contrast_tile"
                style={{backgroundColor: color}}
              >
                <img src={logoFile('vexl-logo', version, 'svg')} alt="" />
                <span
                  className={`brand-contrast_hex${version === 'black' ? '' : ' is-on-dark'}`}
                >
                  {color}
                </span>
              </div>
            ))
          )}
        </div>
      </BrandBlock>
    </>
  )
}
