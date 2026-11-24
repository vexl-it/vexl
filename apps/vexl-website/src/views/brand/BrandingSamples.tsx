import {Array, pipe} from 'effect'
import React from 'react'
import {appHero} from './ApplicationExamples'
import {
  BrandBlock,
  type BrandCopy,
  DownloadList,
  Gallery,
  type GalleryImage,
  GalleryRows,
} from './BrandPage'
import {brandAsset} from './sections'

type SampleAlt =
  | 'vexlItDesktop'
  | 'vexlItMobile'
  | 'howItWorks'
  | 'foundation'
  | 'visualIdentity'
  | 'noKyc'
  | 'sticker'
  | 'meetupStory'

interface Sample {
  readonly file: string
  readonly alt: SampleAlt
  /** Width divided by height */
  readonly ratio: number
}

const identity: ReadonlyArray<readonly Sample[]> = [
  [
    {file: 'vexl-it-desktop.webp', alt: 'vexlItDesktop', ratio: 1920 / 1200},
    {file: 'vexl-it-mobile.webp', alt: 'vexlItMobile', ratio: 1170 / 1992},
  ],
  [{file: 'how-it-works.webp', alt: 'howItWorks', ratio: 1920 / 644}],
  [
    {
      file: 'vexl-foundation-desktop.webp',
      alt: 'foundation',
      ratio: 1920 / 1200,
    },
    {file: 'visual-identity.webp', alt: 'visualIdentity', ratio: 1920 / 1200},
  ],
]

const materials: readonly Sample[] = [
  {file: 'download-sticker.webp', alt: 'sticker', ratio: 1600 / 1000},
  {file: 'meetup-story.webp', alt: 'meetupStory', ratio: 1080 / 1920},
]

const NO_KYC: Sample = {file: 'no-kyc.webp', alt: 'noKyc', ratio: 1702 / 1312}
const APP_HERO_RATIO = 1800 / 1524

/** The basic set of `packages/ui/src/assets/anonymousAvatars`, as SVG files. */
const AVATAR_COUNT = 31

const samples = (
  items: readonly Sample[],
  t: BrandCopy
): readonly GalleryImage[] =>
  Array.map(items, ({file, alt, ratio}) => ({
    src: brandAsset(`samples/${file}`),
    alt: t.text(`samples.alt.${alt}`),
    ratio,
  }))

export function BrandingSamples({
  t,
}: {
  readonly t: BrandCopy
}): React.JSX.Element {
  return (
    <>
      <BrandBlock
        title={t('samples.identity.title')}
        text={t('samples.identity.text')}
      >
        <GalleryRows
          rows={[
            ...Array.map(identity, (row) => samples(row, t)),
            [...samples([NO_KYC], t), {...appHero(t), ratio: APP_HERO_RATIO}],
          ]}
        />
      </BrandBlock>
      <BrandBlock
        title={t('samples.materials.title')}
        text={t('samples.materials.text')}
      >
        <GalleryRows rows={[samples(materials, t)]} />
      </BrandBlock>
      <BrandBlock
        title={t('samples.avatars.title')}
        text={t('samples.avatars.text')}
      >
        <Gallery
          variant="avatars"
          images={pipe(
            Array.range(1, AVATAR_COUNT),
            Array.map((number) => ({
              src: brandAsset(
                `avatars/basic-${String(number).padStart(2, '0')}.svg`
              ),
              alt: `${t.text('samples.alt.avatar')} ${number}`,
            }))
          )}
        />
        <DownloadList
          items={[
            {
              href: brandAsset('avatars/vexl-avatars.zip'),
              label: t('samples.downloadAvatars'),
            },
          ]}
        />
      </BrandBlock>
    </>
  )
}
