import {Array, Option, pipe, Schema} from 'effect'
import {createHash} from 'node:crypto'
import {
  ADMIN_TOKEN_HEADERS,
  CONTACT_INTERNAL_URL,
  psql,
  putToLocalStorage,
  RESOURCES_BASE_URL,
  rgbPng,
  type Rgb,
} from './shared'

interface SeedClub {
  readonly name: string
  readonly description?: string
  readonly memberLimit: number
  /** Days from today; negative is already past validity. */
  readonly validInDays: number
  /** Background and disc color of the generated image; omit for no image. */
  readonly image?: readonly [Rgb, Rgb]
  /** Days of member history and roughly how many join per day; `Infinity` keeps the club full. */
  readonly history?: readonly [days: number, joinsPerDay: number]
  readonly reportLimit?: number
  readonly reports?: number
  readonly inactive?: readonly [daysAgo: number, reason: string]
}

const ORANGE: Rgb = [247, 147, 26]
const BLACK: Rgb = [17, 17, 17]
const YELLOW: Rgb = [252, 205, 108]
const TEAL: Rgb = [13, 148, 136]
const CREAM: Rgb = [254, 245, 223]
const PLUM: Rgb = [124, 58, 237]

// Seeded clubs are recognised by a UUID derived from their name.
const CLUBS: readonly SeedClub[] = [
  {
    name: 'Orange Pill Book Club',
    description: 'One book a month, discussed over coffee. Fictional club.',
    memberLimit: 150,
    validInDays: 310,
    image: [ORANGE, CREAM],
    history: [300, 0.5],
  },
  {
    name: 'Lightning Lunch',
    description: 'Thursday lunches paid over Lightning.',
    memberLimit: 60,
    validInDays: 190,
    image: [YELLOW, BLACK],
    history: [120, 0.45],
  },
  {
    name: 'Node Runners Anonymous',
    description:
      'Support group for people who keep a full node under the TV. We compare uptime, swap spare SSDs, argue about pruning and help each other after every failed upgrade. New members are welcome as long as they bring their own ethernet cable and never ask anyone for their seed phrase.',
    memberLimit: 500,
    validInDays: 420,
    image: [BLACK, ORANGE],
    history: [360, 1.1],
    reports: 2,
  },
  {
    name: 'HODL Chess Society',
    memberLimit: 40,
    validInDays: 75,
    image: [CREAM, BLACK],
    history: [200, 0.2],
  },
  {
    name: 'The Extraordinarily Long-Named Society for the Appreciation of Peer-to-Peer Electronic Cash and Related Weekend Hobbies',
    description: 'Tests how the screens cope with a very long club name.',
    memberLimit: 1000,
    validInDays: 250,
    image: [TEAL, CREAM],
    history: [90, 2.5],
  },
  {
    name: 'Z',
    description: 'Shortest name possible.',
    memberLimit: 10,
    validInDays: 365,
    image: [PLUM, YELLOW],
    history: [20, 0.2],
  },
  {
    name: 'Cypherpunk Knitting Circle',
    description: 'Privacy by default, scarves by request.',
    memberLimit: 25,
    validInDays: 140,
    image: [PLUM, CREAM],
    history: [150, Infinity],
  },
  {
    name: 'Stack Sats Surf Camp',
    description: 'Summer camp alumni. Ends when the season does.',
    memberLimit: 80,
    validInDays: 6,
    image: [TEAL, YELLOW],
    history: [70, 0.9],
  },
  {
    name: 'Block Height Runners',
    description: 'Saturday morning runs, one kilometre per confirmation.',
    memberLimit: 120,
    validInDays: 21,
    image: [ORANGE, BLACK],
    history: [330, 0.3],
  },
  {
    name: 'Farmers Market P2P',
    description: 'Stall holders who take sats for vegetables.',
    memberLimit: 200,
    validInDays: 280,
    history: [45, 0.8],
  },
  {
    name: 'Brand New Club',
    description: 'Created today, nobody has joined yet.',
    memberLimit: 100,
    validInDays: 365,
    image: [YELLOW, ORANGE],
  },
  {
    name: 'Mempool Watchers',
    description: 'One report away from being deactivated.',
    memberLimit: 300,
    validInDays: 200,
    image: [BLACK, YELLOW],
    history: [180, 0.7],
    reportLimit: 5,
    reports: 4,
  },
  {
    name: 'Overdue Demo Club',
    description: 'Past validity, waiting for the cleanup job to deactivate it.',
    memberLimit: 50,
    validInDays: -1,
    image: [CREAM, TEAL],
    history: [100, 0.2],
  },
  {
    name: 'Winter Meetup 2025',
    description: 'Expired with its validity. Extend it before reactivating.',
    memberLimit: 90,
    validInDays: -12,
    image: [TEAL, BLACK],
    history: [240, 0.3],
    inactive: [12, 'EXPIRED'],
  },
  {
    name: 'Totally Legit Giveaways',
    description: 'Reported until it hit its limit.',
    memberLimit: 400,
    validInDays: 160,
    image: [PLUM, ORANGE],
    history: [60, 3],
    reports: 10,
    inactive: [5, 'FLAGGED'],
  },
  {
    name: 'Paused Pilot Club',
    description: 'Deactivated by hand. Nothing blocks reactivating it.',
    memberLimit: 30,
    validInDays: 90,
    history: [130, 0.15],
    inactive: [20, 'UNKNOWN'],
  },
]

const clubUuid = (name: string): string => {
  const hex = createHash('sha256').update(`dev-seed-club:${name}`).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

const IMAGE_SIZE = 128

/** A disc on a plain background, as an RGB PNG. */
const clubImage = ([background, disc]: readonly [
  Rgb,
  Rgb,
]): Buffer<ArrayBuffer> => {
  const center = (IMAGE_SIZE - 1) / 2
  return rgbPng(IMAGE_SIZE, IMAGE_SIZE, (x, y) =>
    Math.hypot(x - center, y - center) < IMAGE_SIZE * 0.3 ? disc : background
  )
}

const api = async <A, I>(
  schema: Schema.Schema<A, I>,
  method: string,
  path: string,
  body?: unknown
): Promise<A> => {
  const response = await fetch(
    `${CONTACT_INTERNAL_URL}/api/v1/clubs/admin${path}`,
    {
      method,
      headers: {...ADMIN_TOKEN_HEADERS, 'Content-Type': 'application/json'},
      body: body === undefined ? undefined : JSON.stringify(body),
    }
  )
  if (!response.ok)
    throw new Error(
      `${method} ${path}: ${response.status}, ${await response.text()}`
    )
  return Schema.decodeUnknownSync(schema)(await response.json())
}

const ExistingClubs = Schema.Struct({
  clubs: Schema.Array(
    Schema.Struct({uuid: Schema.String, clubImageUrl: Schema.String})
  ),
})
const ImageUpload = Schema.Struct({
  presignedUrl: Schema.String,
  s3Key: Schema.String,
  contentType: Schema.String,
})

const uploadImage = async (colors: readonly [Rgb, Rgb]): Promise<string> => {
  const {presignedUrl, s3Key, contentType} = await api(
    ImageUpload,
    'POST',
    '/request-image-upload',
    {fileExtension: 'png'}
  )
  await putToLocalStorage(presignedUrl, contentType, clubImage(colors))
  return `${RESOURCES_BASE_URL}/${s3Key}`
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Creates the club or resets it; an already seeded club keeps its image. */
const upsertClub = async (
  existing: typeof ExistingClubs.Type,
  club: SeedClub
): Promise<void> => {
  const uuid = clubUuid(club.name)
  const found = Array.findFirst(existing.clubs, (one) => one.uuid === uuid)
  const clubImageUrl = Option.isSome(found)
    ? found.value.clubImageUrl
    : club.image
      ? await uploadImage(club.image)
      : ''
  const today = new Date().setUTCHours(0, 0, 0, 0)
  const payload = {
    uuid,
    name: club.name,
    description: club.description,
    membersCountLimit: club.memberLimit,
    clubImageUrl,
    validUntil: new Date(today + club.validInDays * DAY_MS).toISOString(),
    reportLimit: club.reportLimit ?? 10,
  }
  await (Option.isSome(found)
    ? api(Schema.Unknown, 'PUT', '', {clubInfo: payload})
    : api(Schema.Unknown, 'POST', '', {club: payload}))
}

interface DayChange {
  readonly daysAgo: number
  readonly joined: number
  readonly left: number
}

/** Daily joins and leaves that never exceed the limit or drop below zero. */
const memberHistory = (club: SeedClub): readonly DayChange[] => {
  const [days, joinsPerDay] = club.history ?? [0, 0]
  const lastDay = club.inactive?.[0] ?? 0
  let members = 0
  return pipe(
    Array.range(lastDay, Math.max(lastDay, days)),
    Array.reverse,
    Array.map((daysAgo) => {
      const left = Math.random() < 0.02 + members / 500 ? 1 : 0
      const joined = Math.min(
        club.memberLimit - members + left,
        Math.floor(joinsPerDay * 3 * Math.random() ** 2 + Math.random())
      )
      members += joined - left
      return {daysAgo, joined, left}
    }),
    Array.filter(({joined, left}) => days > 0 && joined + left > 0)
  )
}

// No admin API creates members, reports or the inactive state.
const stateSql = (club: SeedClub): string => {
  const history = memberHistory(club)
  const members = Array.reduce(
    history,
    0,
    (sum, {joined, left}) => sum + joined - left
  )
  const uuid = clubUuid(club.name)
  const clubId = `(SELECT id FROM club WHERE uuid = '${uuid}')`
  const [inactiveDaysAgo, inactiveReason] = club.inactive ?? []
  const historyRows = pipe(
    history,
    Array.map(
      ({daysAgo, joined, left}) =>
        `(${clubId}, current_date - ${daysAgo}, ${joined}, ${left})`
    )
  )
  return `
    UPDATE club SET
      report = ${club.reports ?? 0},
      made_inactive_at = ${inactiveDaysAgo === undefined ? 'NULL' : `current_date - ${inactiveDaysAgo}`},
      made_inactive_reason = ${inactiveReason === undefined ? 'NULL' : `'${inactiveReason}'`}
    WHERE uuid = '${uuid}';
    DELETE FROM club_member_count_change WHERE club_id = ${clubId};
    DELETE FROM club_member
      WHERE club_id = ${clubId} AND public_key LIKE 'dev-seed-%';
    ${
      Array.isNonEmptyArray(historyRows)
        ? `INSERT INTO club_member_count_change (club_id, day, joined_count, left_count)
            VALUES ${Array.join(historyRows, ',')};`
        : ''
    }
    INSERT INTO club_member (club_id, public_key, last_refreshed_at, is_moderator)
      SELECT ${clubId}, 'dev-seed-${uuid}-' || n, now(), n = 1
      FROM generate_series(1, ${members}) AS n;
  `
}

const main = async (): Promise<void> => {
  const existing = await api(ExistingClubs, 'GET', '')
  for (const club of CLUBS) await upsertClub(existing, club)
  psql('contact', pipe(CLUBS, Array.map(stateSql), Array.join('')))
  console.log(`Clubs: ${CLUBS.length} seeded`)
}

void main()
