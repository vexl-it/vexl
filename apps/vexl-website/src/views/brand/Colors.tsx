import {Array, Option, pipe} from 'effect'
import React from 'react'
import {type BrandCopy, BrandBlock, DownloadList} from './BrandPage'
import {brandAsset} from './sections'

/**
 * The palette of `packages/ui/src/config/tokens.ts`, plus the glasses' grey.
 * Print values come from the previous manual, which predates the other
 * colors. `public/wf/brand/colors` holds the same palette as downloads.
 */
interface BrandColor {
  readonly name:
    | 'yellow'
    | 'black'
    | 'white'
    | 'lightYellow'
    | 'gold'
    | 'darkYellow'
    | 'lightGreen'
    | 'darkGreen'
    | 'lightPink'
    | 'darkPink'
    | 'lightRed'
    | 'darkRed'
    | 'almostBlack'
  readonly hex: string
  readonly cmyk?: string
  readonly pantone?: string
}

const downloadFormats = ['ase', 'css', 'json', 'zip'] as const

const mainColors: readonly BrandColor[] = [
  {name: 'yellow', hex: '#FCCD6C', cmyk: '1, 20, 67, 0', pantone: '134 C'},
  {name: 'black', hex: '#000000', cmyk: '0, 0, 0, 100'},
  {name: 'white', hex: '#FFFFFF'},
]

const secondaryColors: readonly BrandColor[] = [
  {name: 'lightYellow', hex: '#FFE1A2'},
  {name: 'gold', hex: '#BE8821'},
  {name: 'darkYellow', hex: '#4C3E20'},
  {name: 'lightGreen', hex: '#ACD9B7', cmyk: '33, 0, 35, 0'},
  {name: 'darkGreen', hex: '#455749'},
  {name: 'lightPink', hex: '#FCC5F3', cmyk: '3, 26, 0, 0'},
  {name: 'darkPink', hex: '#654F61'},
  {name: 'lightRed', hex: '#EE675E'},
  {name: 'darkRed', hex: '#A0433C'},
  {name: 'almostBlack', hex: '#333333', cmyk: '0, 0, 0, 90'},
]

const channels = (hex: string): readonly number[] =>
  Array.map([1, 3, 5], (start) => parseInt(hex.slice(start, start + 2), 16))

const toRgb = (hex: string): string => channels(hex).join(', ')

const isDark = (hex: string): boolean => {
  const [red = 0, green = 0, blue = 0] = channels(hex)
  return 0.299 * red + 0.587 * green + 0.114 * blue < 140
}

function Swatches({
  colors,
  t,
}: {
  readonly colors: readonly BrandColor[]
  readonly t: BrandCopy
}): React.JSX.Element {
  return (
    <ul className="brand-swatches">
      {pipe(
        colors,
        Array.map((color) => (
          <li
            key={color.name}
            className={`brand-swatch${isDark(color.hex) ? ' is-dark' : ''}`}
            style={{backgroundColor: color.hex}}
          >
            <h3 className="brand-swatch_name">
              {t(`colors.name.${color.name}`)}
            </h3>
            <dl className="brand-swatch_values">
              {pipe(
                [
                  {label: 'HEX', value: color.hex},
                  {label: 'RGB', value: toRgb(color.hex)},
                  {label: 'CMYK', value: color.cmyk},
                  {label: 'Pantone', value: color.pantone},
                ],
                Array.filterMap(({label, value}) =>
                  Option.map(Option.fromNullable(value), (shown) => (
                    <div key={label} className="brand-swatch_row">
                      <dt>{label}</dt>
                      <dd>{shown}</dd>
                    </div>
                  ))
                )
              )}
            </dl>
          </li>
        ))
      )}
    </ul>
  )
}

export function Colors({t}: {readonly t: BrandCopy}): React.JSX.Element {
  return (
    <>
      <BrandBlock title={t('colors.main.title')} text={t('colors.main.text')}>
        <Swatches colors={mainColors} t={t} />
      </BrandBlock>
      <BrandBlock
        title={t('colors.secondary.title')}
        text={t('colors.secondary.text')}
      >
        <Swatches colors={secondaryColors} t={t} />
      </BrandBlock>
      <BrandBlock
        title={t('colors.downloads.title')}
        text={t('colors.downloads.text')}
      >
        <DownloadList
          items={pipe(
            downloadFormats,
            Array.map((format) => ({
              href: brandAsset(`colors/vexl-colors.${format}`),
              label: t(`colors.download.${format}`),
            }))
          )}
        />
      </BrandBlock>
    </>
  )
}
