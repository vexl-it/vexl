import {Array, Option, pipe, Schema} from 'effect'
import {RequestUploadResponse} from '../../src/services/uploadToPresignedUrl'
import {
  ADMIN_TOKEN_HEADERS,
  BACKOFFICE_URL,
  CONTENT_INTERNAL_URL,
  psql,
  putToLocalStorage,
  rgbPng,
  type Rgb,
} from './shared'

type Status = 'draft' | 'published'

const DAY_MS = 86_400_000
const daysFromNow = (days: number): string =>
  new Date(Date.now() + days * DAY_MS).toISOString()

const Item = Schema.Struct({id: Schema.String, status: Schema.String})
const Posts = Schema.Struct({
  blogPosts: Schema.Array(Schema.Struct({...Item.fields, slug: Schema.String})),
})
const Events = Schema.Struct({
  events: Schema.Array(Schema.Struct({...Item.fields, name: Schema.String})),
})

const api = async <A, I>(
  schema: Schema.Schema<A, I>,
  path: string,
  init?: RequestInit
): Promise<A> => {
  const response = await fetch(
    `${CONTENT_INTERNAL_URL}/content/admin/${path}`,
    {
      ...init,
      headers: {...ADMIN_TOKEN_HEADERS, 'Content-Type': 'application/json'},
    }
  )
  if (!response.ok) {
    throw new Error(`${path} ${response.status}: ${await response.text()}`)
  }
  return Schema.decodeUnknownSync(schema)(await response.json())
}

/** A diagonal two-colour gradient with a soft spotlight, as a PNG. */
const gradientPng = (
  width: number,
  height: number,
  from: Rgb,
  to: Rgb
): Buffer<ArrayBuffer> =>
  rgbPng(width, height, (x, y) => {
    const mix = (x / width + y / height) / 2
    const glow = Math.max(
      0,
      1 - Math.hypot(x / width - 0.7, y / height - 0.35) * 2.5
    )
    const channel = (index: 0 | 1 | 2): number =>
      Math.min(255, from[index] + (to[index] - from[index]) * mix + glow * 70)
    return [channel(0), channel(1), channel(2)]
  })

/** Goes through the backoffice upload flow, so the image really is in MinIO. */
const uploadImage = async (
  width: number,
  height: number,
  [from, to]: readonly [Rgb, Rgb]
): Promise<string> => {
  const requested = await fetch(
    `${BACKOFFICE_URL}/api/admin/cms/request-upload`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({fileExtension: 'png'}),
    }
  )
  if (!requested.ok) throw new Error(`request-upload ${requested.status}`)
  const upload = Schema.decodeUnknownSync(RequestUploadResponse)(
    await requested.json()
  )
  await putToLocalStorage(
    upload.presignedUrl,
    upload.contentType,
    gradientPng(width, height, from, to)
  )
  return upload.assetUrl
}

const YELLOW: readonly [Rgb, Rgb] = [
  [252, 205, 108],
  [190, 136, 33],
]
const NIGHT: readonly [Rgb, Rgb] = [
  [16, 16, 16],
  [101, 79, 97],
]
const GREEN: readonly [Rgb, Rgb] = [
  [69, 87, 73],
  [213, 236, 219],
]
const CORAL: readonly [Rgb, Rgb] = [
  [238, 103, 94],
  [255, 225, 162],
]

interface SeedPost {
  readonly slug: string
  readonly title: string
  /** Null leaves the post English-only, like the ones imported from Webflow. */
  readonly czechTitle: string | null
  readonly status: Status
  readonly featured: boolean
  readonly publishedInDays: number
  readonly cover: readonly [Rgb, Rgb] | null
  readonly long: boolean
}

const post = (
  slug: string,
  title: string,
  czechTitle: string | null,
  status: Status,
  publishedInDays: number,
  cover: readonly [Rgb, Rgb] | null,
  {featured = false, long = true} = {}
): SeedPost => ({
  slug: `demo-${slug}`,
  title,
  czechTitle,
  status,
  featured,
  publishedInDays,
  cover,
  long,
})

const POSTS: readonly SeedPost[] = [
  post(
    'meetup-season-recap',
    'Demo: what we learned from a season of meetups',
    'Demo: co jsme se naučili za sezónu meetupů',
    'published',
    -2,
    YELLOW,
    {featured: true}
  ),
  post(
    'offers-in-your-network',
    'Demo: how offers travel through your network',
    'Demo: jak se nabídky šíří vaší sítí',
    'published',
    -9,
    NIGHT
  ),
  post(
    'winter-update',
    'Demo: the winter update (scheduled)',
    'Demo: zimní aktualizace (naplánováno)',
    'published',
    12,
    GREEN,
    {featured: true}
  ),
  post('release-notes', 'Demo notes', 'Demo poznámky', 'draft', 0, null, {
    long: false,
  }),
  post(
    'working-title',
    'Demo: a very long working title that someone will definitely shorten before it goes out, because nobody reads a headline that wraps onto four lines',
    'Demo: velmi dlouhý pracovní název, který někdo před vydáním určitě zkrátí, protože titulek na čtyři řádky nikdo nečte',
    'draft',
    3,
    CORAL
  ),
  post(
    'interview-english-only',
    'Demo: an interview that was never translated',
    null,
    'published',
    -30,
    CORAL
  ),
  post('english-draft', 'Demo: half-finished idea', null, 'draft', 1, null, {
    long: false,
  }),
  post(
    'privacy-checklist',
    'Demo: a privacy checklist for your first trade',
    'Demo: kontrolní seznam soukromí pro první obchod',
    'published',
    -45,
    GREEN,
    {featured: true}
  ),
  post('faq', 'Demo FAQ', 'Demo FAQ', 'draft', 7, YELLOW, {featured: true}),
  post(
    'two-years-ago',
    'Demo: a post from the archive',
    'Demo: příspěvek z archivu',
    'published',
    -720,
    NIGHT
  ),
  post(
    'no-cover',
    'Demo: a published post without a cover image',
    'Demo: zveřejněný příspěvek bez úvodního obrázku',
    'published',
    -60,
    null
  ),
  post(
    'unpublished-again',
    'Demo: pulled back for edits',
    'Demo: staženo k úpravám',
    'draft',
    -15,
    NIGHT
  ),
]

const body = (czech: boolean, long: boolean, image: string | null): string => {
  const intro = czech
    ? '<p>Tohle je <strong>ukázkový text</strong> pro vývojové prostředí. Nic z toho se nestalo, ale vypadá to jako <em>skutečný článek</em>.</p>'
    : '<p>This is <strong>demo copy</strong> for the dev environment. None of it happened, but it reads like a <em>real article</em>.</p>'
  if (!long) return intro
  return [
    intro,
    czech ? '<h2>Proč na tom záleží</h2>' : '<h2>Why it matters</h2>',
    czech
      ? '<p>Lidé obchodují s těmi, které znají. Více v <a href="https://example.com/docs">ukázkové dokumentaci</a>.</p>'
      : '<p>People trade with people they know. More in the <a href="https://example.com/docs">demo documentation</a>.</p>',
    czech
      ? '<ul><li>Žádné účty</li><li>Žádné sledování</li><li>Jen vaše kontakty</li></ul>'
      : '<ul><li>No accounts</li><li>No tracking</li><li>Only your contacts</li></ul>',
    image ? `<img src="${image}" alt="Demo illustration">` : '',
    czech ? '<h3>Krok za krokem</h3>' : '<h3>Step by step</h3>',
    czech
      ? '<ol><li>Vytvořte nabídku</li><li>Počkejte na odpověď</li><li>Sejděte se osobně</li></ol>'
      : '<ol><li>Create an offer</li><li>Wait for a reply</li><li>Meet in person</li></ol>',
    czech
      ? '<blockquote>Nejlepší obchod je ten, o kterém nikdo jiný neví.</blockquote>'
      : '<blockquote>The best trade is the one nobody else knows about.</blockquote>',
    czech
      ? '<p>Děkujeme, že jste dočetli až sem.</p>'
      : '<p>Thanks for reading this far.</p>',
  ].join('')
}

interface SeedEvent {
  readonly name: string
  readonly venue: string
  readonly status: Status
  readonly startsInDays: number
  /** Null for an event without an end date. */
  readonly lastsDays: number | null
  readonly goldenGlasses: boolean
  readonly speakers: ReadonlyArray<
    readonly [string, readonly [Rgb, Rgb] | null]
  >
}

const event = (
  name: string,
  venue: string,
  status: Status,
  startsInDays: number,
  lastsDays: number | null,
  speakers: SeedEvent['speakers'],
  goldenGlasses = false
): SeedEvent => ({
  name: `${name} (demo)`,
  venue,
  status,
  startsInDays,
  lastsDays,
  goldenGlasses,
  speakers,
})

const EVENTS: readonly SeedEvent[] = [
  event('Vexl meetup #101', 'Kavárna Příklad, Praha 🇨🇿', 'published', 6, 0.15, [
    ['Alice Example', YELLOW],
  ]),
  event(
    'Peer to Peer Days',
    'Example Congress Centre, Lisbon 🇵🇹',
    'published',
    21,
    2,
    [
      ['Alice Example', YELLOW],
      ['Bob Placeholder', NIGHT],
      ['Carol Sample', null],
    ],
    true
  ),
  event(
    'Workshop: your first trade',
    'Sample Hub, Vienna 🇦🇹',
    'draft',
    35,
    0.1,
    [['Bob Placeholder', NIGHT]]
  ),
  event(
    'The Extremely Long Named International Conference On Private Peer To Peer Money, Winter Edition',
    'Hall B, Example Exhibition Grounds, 123 Placeholder Avenue, Berlin 10115, Germany 🇩🇪',
    'published',
    60,
    3,
    [['Carol Sample', GREEN]]
  ),
  event(
    'Vexl club night',
    'Demo Bar, Bratislava 🇸🇰',
    'published',
    90,
    null,
    []
  ),
  event('Hackathon weekend', 'Sample Space, Ljubljana 🇸🇮', 'published', -1, 3, [
    ['Dave Mockup', CORAL],
  ]),
  event(
    'Spring meetup, still planning',
    'To be announced',
    'draft',
    150,
    null,
    [['No speaker', null]]
  ),
  event(
    'Vexl meetup #100',
    'Example Café, Brno 🇨🇿',
    'published',
    -20,
    0.15,
    [['Alice Example', YELLOW]],
    true
  ),
  event('Cancelled workshop', 'Sample Library, Warsaw 🇵🇱', 'draft', -40, 0.1, [
    ['Bob Placeholder', null],
  ]),
  event(
    'Autumn privacy summit',
    'Placeholder Arena, Zurich 🇨🇭',
    'published',
    -75,
    2,
    [
      ['Carol Sample', GREEN],
      ['Dave Mockup', CORAL],
    ]
  ),
]

/** Creates what is missing and publishes it if it should be live. */
const ensure = async (
  path: string,
  existing: Option.Option<typeof Item.Type>,
  status: Status,
  makeInput: () => Promise<unknown>
): Promise<boolean> => {
  const item = Option.isSome(existing)
    ? existing.value
    : await api(Item, path, {
        method: 'POST',
        body: JSON.stringify(await makeInput()),
      })
  if (status === 'published' && item.status !== 'published') {
    await api(Item, `${path}/${item.id}/publish`, {method: 'POST'})
  }
  return Option.isNone(existing)
}

const postInput = async (seed: SeedPost) => {
  const cover = seed.cover ? await uploadImage(960, 540, seed.cover) : null
  const inline =
    seed.long && seed.cover ? await uploadImage(800, 400, CORAL) : null
  const summary = seed.long
    ? {summary: `${seed.title} in two sentences. Demo data.`}
    : {}
  return {
    slug: seed.slug,
    featured: seed.featured,
    ...(cover ? {imageUrl: cover} : {}),
    publishedAt: daysFromNow(seed.publishedInDays),
    en: {title: seed.title, ...summary, body: body(false, seed.long, inline)},
    // The API needs both languages; English-only posts lose Czech below.
    cs: {
      title: seed.czechTitle ?? seed.title,
      body: body(true, seed.long, inline),
    },
  }
}

const eventInput = async (seed: SeedEvent) => ({
  name: seed.name,
  venue: seed.venue,
  link: `https://example.com/events/${encodeURIComponent(seed.name)}`,
  startDate: daysFromNow(seed.startsInDays),
  ...(seed.lastsDays === null
    ? {}
    : {endDate: daysFromNow(seed.startsInDays + seed.lastsDays)}),
  goldenGlasses: seed.goldenGlasses,
  speakers: await Promise.all(
    Array.map(seed.speakers, async ([name, photo]) => ({
      name,
      ...(photo
        ? {
            imageUrl: await uploadImage(240, 240, photo),
            linkToSocials: 'https://example.com/speakers',
          }
        : {}),
    }))
  ),
})

const main = async (): Promise<void> => {
  const {blogPosts} = await api(Posts, 'blog-posts')
  const {events} = await api(Events, 'events')

  const createdPosts = await Promise.all(
    Array.map(POSTS, (seed) =>
      ensure(
        'blog-posts',
        Array.findFirst(blogPosts, (one) => one.slug === seed.slug),
        seed.status,
        () => postInput(seed)
      )
    )
  )
  const createdEvents = await Promise.all(
    Array.map(EVENTS, (seed) =>
      ensure(
        'events',
        Array.findFirst(events, (one) => one.name === seed.name),
        seed.status,
        () => eventInput(seed)
      )
    )
  )

  // The API cannot store an English-only post or set a creation date.
  const quotedSlugs = (posts: typeof POSTS): string =>
    pipe(
      posts,
      Array.map((seed) => `'${seed.slug}'`),
      Array.join(', ')
    )
  const englishOnly = Array.filter(POSTS, (seed) => seed.czechTitle === null)
  psql(
    'content',
    [
      `UPDATE blog_posts SET title_cs = NULL, summary_cs = NULL, body_cs = NULL WHERE slug IN (${quotedSlugs(englishOnly)});`,
      `UPDATE blog_posts SET created_at = LEAST(published_at, now()) - interval '4 days' WHERE slug IN (${quotedSlugs(POSTS)});`,
    ].join('\n')
  )

  const count = (created: readonly boolean[]): number =>
    Array.filter(created, (one) => one).length
  console.log(
    `CMS: ${count(createdPosts)} of ${POSTS.length} blog posts and ${count(createdEvents)} of ${EVENTS.length} events created`
  )
}

void main()
