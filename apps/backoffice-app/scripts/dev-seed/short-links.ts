import {Array, Option, pipe, Schema} from 'effect'
import {
  type ShortLink,
  ShortLinkListResponse,
  ShortLinkResponse,
} from '../../src/services/shortLinks/domain'
import {BACKOFFICE_URL, psql} from './shared'

type Profile = 'zero' | 'steady' | 'spiky' | 'growing' | 'fading' | 'launch'

interface SeedLink {
  readonly slug?: string
  readonly targetUrl: string
  readonly daysAgo: number
  readonly profile: Profile
  readonly base: number
}

const link = (
  targetUrl: string,
  daysAgo: number,
  profile: Profile,
  base: number,
  slug?: string
): SeedLink => ({targetUrl, daysAgo, profile, base, slug})

// Seeded links are recognised by their target, so every target is unique.
const LINKS: readonly SeedLink[] = [
  link('https://example.com/download', 140, 'steady', 60, 'app'),
  link('https://example.com/ios', 140, 'steady', 35, 'ios'),
  link('https://example.com/android', 140, 'steady', 28, 'android'),
  link(
    'https://example.com/meetups/prague-2026-autumn?utm_source=poster&utm_medium=qr&utm_campaign=prague-autumn-meetup',
    45,
    'launch',
    220,
    'meetup-prague'
  ),
  link('https://example.com/meetups/berlin', 80, 'launch', 140, 'berlin'),
  link('https://example.com/blog/why-p2p', 120, 'fading', 45, 'why-p2p'),
  link(
    'https://example.com/blog/2026/how-to-trade-safely-within-your-social-network-a-complete-beginners-guide',
    60,
    'spiky',
    180,
    'safe-trading-guide'
  ),
  link('https://example.com/donate', 100, 'growing', 30, 'donate'),
  link('https://example.com/clubs', 90, 'growing', 55, 'clubs'),
  link('https://example.com/faq', 130, 'steady', 12, 'faq'),
  link('https://example.com/press-kit.zip', 110, 'spiky', 90, 'press'),
  link('https://example.com/jobs', 20, 'steady', 8, 'jobs'),
  link('https://example.com/podcast/42', 35, 'launch', 300, 'podcast-42'),
  link(
    'https://example.com/newsletter/subscribe?ref=sticker',
    75,
    'steady',
    5,
    'news'
  ),
  link('https://example.com/conference-2026/talk-slides', 9, 'launch', 90),
  link('https://example.com/a', 3, 'steady', 4),
  link('https://example.com/survey/community-2026', 25, 'fading', 70),
  link('https://example.com/partners/onboarding-pack', 50, 'spiky', 40),
  link(
    'https://example.com/docs/translations/contributing?lang=cs&section=glossary&from=backoffice',
    65,
    'steady',
    3
  ),
  link('https://example.com/video/intro', 115, 'fading', 120),
  link('https://example.com/merch', 7, 'growing', 25, 'merch'),
  link('https://example.com/old-campaign', 135, 'zero', 0, 'spring-campaign'),
  link('https://example.com/draft-landing', 2, 'zero', 0, 'draft'),
  link('https://example.com/internal/test-redirect', 0, 'zero', 0),
  link(
    'https://example.com/this-is-a-very-long-slug-example',
    15,
    'spiky',
    25,
    'the-longest-slug-anyone-on-the-team-has-ever-typed-in-2026'
  ),
]

const RETARGETED = ['app', 'donate', 'press', 'berlin']

const clicksOnDay = (
  {profile, base, daysAgo}: SeedLink,
  dayAgo: number
): number => {
  const age = daysAgo - dayAgo
  const noise = 0.6 + Math.random() * 0.8
  const shape: Record<Profile, number> = {
    zero: 0,
    steady: 1,
    spiky: Math.random() < 0.07 ? 1 + Math.random() * 2 : 0.02,
    growing: (age + 1) / (daysAgo + 1),
    fading: Math.max(0, dayAgo / daysAgo - 0.35),
    launch: Math.exp(-age / 6),
  }
  return Math.round(base * shape[profile] * noise)
}

const request = async <A, I>(
  schema: Schema.Schema<A, I>,
  init?: RequestInit
): Promise<A> => {
  const response = await fetch(`${BACKOFFICE_URL}/api/admin/short-links`, {
    ...init,
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) {
    throw new Error(`${response.status}: ${await response.text()}`)
  }
  return Schema.decodeUnknownSync(schema)(await response.json())
}

const seedLink = async (existing: readonly ShortLink[], seed: SeedLink) => {
  const found = pipe(
    existing,
    Array.findFirst(({targetUrl}) => targetUrl === seed.targetUrl)
  )
  if (Option.isSome(found)) {
    return {seed, slug: found.value.slug, created: false}
  }
  const response = await request(ShortLinkResponse, {
    method: 'POST',
    body: JSON.stringify({targetUrl: seed.targetUrl, slug: seed.slug}),
  })
  return {seed, slug: response.link.slug, created: true}
}

const main = async (): Promise<void> => {
  const existing = (await request(ShortLinkListResponse)).links
  const seeded = await Promise.all(
    pipe(
      LINKS,
      Array.map((seed) => seedLink(existing, seed))
    )
  )
  const created = pipe(
    seeded,
    Array.filter((link) => link.created)
  )

  // Creation dates and click history cannot be set through the API.
  const backdate = pipe(
    created,
    Array.map(({seed, slug}) => {
      const editedDaysAgo = Array.contains(RETARGETED, slug)
        ? Math.floor(seed.daysAgo / 3)
        : seed.daysAgo
      return `UPDATE backoffice_short_links SET created_at = now() - interval '${seed.daysAgo} days', updated_at = now() - interval '${editedDaysAgo} days' WHERE slug = '${slug}';`
    })
  )
  const clickRows = pipe(
    created,
    Array.flatMap(({seed, slug}) =>
      pipe(
        Array.makeBy(seed.daysAgo + 1, (dayAgo) => ({
          dayAgo,
          count: clicksOnDay(seed, dayAgo),
        })),
        Array.filter(({count}) => count > 0),
        Array.map(
          ({dayAgo, count}) => `('${slug}', CURRENT_DATE - ${dayAgo}, ${count})`
        )
      )
    )
  )

  const statements = [
    ...backdate,
    ...(Array.isNonEmptyArray(clickRows)
      ? [
          `INSERT INTO backoffice_short_link_clicks (slug, day, count) VALUES ${clickRows.join(', ')};`,
        ]
      : []),
  ]
  if (Array.isNonEmptyArray(statements))
    psql('backoffice', statements.join('\n'))

  console.log(
    `Short links: ${created.length} created with click history, ${seeded.length - created.length} already there`
  )
}

void main()
