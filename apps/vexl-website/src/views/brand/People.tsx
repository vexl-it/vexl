import {Array, pipe} from 'effect'
import React from 'react'
import {type CopyKey} from '../../copy/copyFiles'
import {type BrandCopy, BrandBlock, Gallery} from './BrandPage'
import {brandAsset} from './sections'

interface Person {
  readonly role: CopyKey<'brand'>
  readonly bio?: CopyKey<'brand'>
  readonly slug: string
  readonly name: string
  readonly linkedin: string
  readonly x: string
}

const people: readonly Person[] = [
  {
    role: 'people.viliam.role',
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
    linkedin: 'https://www.linkedin.com/in/pavolrusnak/',
    x: 'https://x.com/PavolRusnak',
  },
  {
    role: 'people.josef.role',
    bio: 'people.josef.bio',
    slug: 'josef-tetek',
    name: 'Josef Tětek',
    linkedin: 'https://www.linkedin.com/in/joseftetek/',
    x: 'https://x.com/JosefTetek',
  },
]

const vibes = [
  'vexl-xmas',
  'vexl-btcprague-23',
  'vexl-chaincamp-22',
  'vexl-x-sl-meetup-4',
  'vexl-btcp-24',
  'vexl-btcprague-2024',
  'vexl-btcprague-24',
  'vexl-btcp-2024',
  'vexl-does-btcprague',
  'vexl-team-2',
  'vexl-team',
  'vexl-btcprague-2024-2',
  'vexl-meetup-ash',
  'peer-to-peer',
  'vexl-x-sl-meetup',
  'vexl-x-sl-meetup-3',
  'vexl-btcp',
  'vexl-promo',
  'vexl-x-sl-meetup-2',
]

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
                      <a
                        href={person.linkedin}
                        target="_blank"
                        rel="noreferrer"
                      >
                        LinkedIn ↗
                      </a>
                      <a href={person.x} target="_blank" rel="noreferrer">
                        X ↗
                      </a>
                      <a href={photo} download>
                        {t('people.downloadPhoto')} ↓
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
        <Gallery
          variant="photos"
          images={Array.map(vibes, (file) => ({
            src: brandAsset(`vibes/${file}.webp`),
            alt: t.text('people.vibes.alt'),
          }))}
        />
      </BrandBlock>
    </>
  )
}
