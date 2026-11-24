import {Array, pipe} from 'effect'
import React from 'react'
import {type BrandCopy, BrandBlock, DownloadList, Gallery} from './BrandPage'
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

const identity = [
  {file: 'vexl-it-desktop.webp', alt: 'vexlItDesktop'},
  {file: 'vexl-it-mobile.webp', alt: 'vexlItMobile'},
  {file: 'how-it-works.webp', alt: 'howItWorks'},
  {file: 'no-kyc.webp', alt: 'noKyc'},
  {file: 'vexl-foundation-desktop.webp', alt: 'foundation'},
  {file: 'visual-identity.webp', alt: 'visualIdentity'},
] satisfies ReadonlyArray<{file: string; alt: SampleAlt}>

const materials = [
  {file: 'download-sticker.webp', alt: 'sticker'},
  {file: 'meetup-story.webp', alt: 'meetupStory'},
] satisfies ReadonlyArray<{file: string; alt: SampleAlt}>

/** The basic set of `packages/ui/src/assets/anonymousAvatars`, as SVG files. */
const AVATAR_COUNT = 31

const samples = (
  items: ReadonlyArray<{file: string; alt: SampleAlt}>,
  t: BrandCopy
): ReadonlyArray<{src: string; alt: string}> =>
  Array.map(items, ({file, alt}) => ({
    src: brandAsset(`samples/${file}`),
    alt: t.text(`samples.alt.${alt}`),
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
        <Gallery images={samples(identity, t)} />
      </BrandBlock>
      <BrandBlock
        title={t('samples.materials.title')}
        text={t('samples.materials.text')}
      >
        <Gallery images={samples(materials, t)} />
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
              alt: t.text('samples.alt.avatar'),
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
