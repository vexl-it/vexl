import {Array, pipe} from 'effect'
import React from 'react'
import {type CopyKey} from '../../copy/copyFiles'
import {
  type BrandCopy,
  BrandBlock,
  GalleryRows,
  ScreenReaderText,
} from './BrandPage'
import {brandAsset} from './sections'

interface Person {
  readonly role: CopyKey<'brand'>
  readonly bio?: CopyKey<'brand'>
  readonly slug: string
  readonly name: string
  readonly linkedin?: string
  readonly x: string
}

const people: readonly Person[] = [
  {
    role: 'people.viliam.role',
    bio: 'people.viliam.bio',
    slug: 'viliam-klamarcik',
    name: 'Viliam Klamarčík',
    linkedin: 'https://www.linkedin.com/in/viliamklamarcik/',
    x: 'https://x.com/ViliamKlamarcik',
  },
  {
    role: 'people.lea.role',
    bio: 'people.lea.bio',
    slug: 'lea-petrasova',
    name: 'Lea Petrášová',
    linkedin: 'https://www.linkedin.com/in/leapetras/',
    x: 'https://x.com/LeaPetras',
  },
  {
    role: 'people.slush.role',
    bio: 'people.slush.bio',
    slug: 'marek-palatinus',
    name: 'Marek "Slush" Palatinus',
    linkedin: 'https://www.linkedin.com/in/marekpalatinus/',
    x: 'https://x.com/slush',
  },
  {
    role: 'people.stick.role',
    bio: 'people.stick.bio',
    slug: 'pavol-rusnak',
    name: 'Pavol "Stick" Rusnák',
    x: 'https://x.com/PavolRusnak',
  },
]

type VibeAlt =
  | 'pears'
  | 'boothGame'
  | 'panel'
  | 'chaincamp'
  | 'booth'
  | 'meetupQuestions'
  | 'meetupTalk'
  | 'meetupStage'
  | 'meetupAudience'

/** Rows of photos, `ratio` is width divided by height. */
const vibes = [
  [
    {file: 'peer-to-peer', alt: 'pears', ratio: 3 / 2},
    {file: 'vexl-team-2', alt: 'booth', ratio: 2 / 3},
    {file: 'vexl-btcprague-2024-2', alt: 'boothGame', ratio: 3 / 2},
  ],
  [
    {file: 'vexl-btcprague-2024', alt: 'panel', ratio: 3 / 2},
    {file: 'vexl-chaincamp-22', alt: 'chaincamp', ratio: 4 / 3},
    {file: 'vexl-x-sl-meetup', alt: 'meetupAudience', ratio: 3 / 2},
  ],
  [
    {file: 'vexl-x-sl-meetup-2', alt: 'meetupQuestions', ratio: 3 / 2},
    {file: 'vexl-x-sl-meetup-3', alt: 'meetupTalk', ratio: 3 / 2},
    {file: 'vexl-x-sl-meetup-4', alt: 'meetupStage', ratio: 3 / 2},
  ],
] satisfies ReadonlyArray<
  ReadonlyArray<{file: string; alt: VibeAlt; ratio: number}>
>

export function People({t}: {readonly t: BrandCopy}): React.JSX.Element {
  return (
    <>
      <section className="container is-base-pading brand-block">
        <ul className="brand-people">
          {pipe(
            people,
            Array.map((person) => {
              const photo = brandAsset(`people/${person.slug}.webp`)
              return (
                <li key={person.slug} id={person.slug} className="brand-person">
                  <img
                    src={photo}
                    alt={person.name}
                    loading="lazy"
                    className="brand-person_photo"
                  />
                  <div className="brand-person_body">
                    <h2 className="h6 brand-person_name">{person.name}</h2>
                    <p className="brand-person_role">{t(person.role)}</p>
                    {person.bio === undefined ? null : (
                      <p className="brand-text">{t(person.bio)}</p>
                    )}
                    <div className="brand-person_links">
                      {person.linkedin === undefined ? null : (
                        <a
                          href={person.linkedin}
                          target="_blank"
                          rel="noreferrer"
                        >
                          LinkedIn
                          <ScreenReaderText>, {person.name}</ScreenReaderText> ↗
                        </a>
                      )}
                      <a href={person.x} target="_blank" rel="noreferrer">
                        X<ScreenReaderText>, {person.name}</ScreenReaderText> ↗
                      </a>
                      <a href={photo} download>
                        {t('people.downloadPhoto')}
                        <ScreenReaderText>, {person.name}</ScreenReaderText> ↓
                      </a>
                    </div>
                  </div>
                </li>
              )
            })
          )}
        </ul>
      </section>
      <BrandBlock title={t('people.vibes.title')} text={t('people.vibes.text')}>
        <GalleryRows
          rows={Array.map(vibes, (row) =>
            Array.map(row, ({file, alt, ratio}) => ({
              src: brandAsset(`vibes/${file}.webp`),
              alt: t.text(`people.vibes.alt.${alt}`),
              ratio,
            }))
          )}
        />
      </BrandBlock>
    </>
  )
}
