import {Array, Order, pipe, Schema} from 'effect'
import {readContentFile} from '../../content/files'

const CommunityEvent = Schema.Struct({
  /** `YYYY-MM-DD` */
  date: Schema.String.pipe(Schema.pattern(/^\d{4}-\d{2}-\d{2}$/)),
  name: Schema.String,
  url: Schema.String,
  /** The Vexl glasses before the name. */
  showGlasses: Schema.optional(Schema.Boolean),
  speakers: Schema.optional(Schema.String),
  location: Schema.String,
  start: Schema.String,
  end: Schema.optional(Schema.String),
})
export type CommunityEvent = typeof CommunityEvent.Type

const PAGE_SIZE = 5

const byDate = Order.mapInput(
  Order.string,
  (event: CommunityEvent) => event.date
)

/** Upcoming and past as of the build. */
function splitEvents(): {
  readonly upcoming: readonly CommunityEvent[]
  readonly past: readonly CommunityEvent[]
} {
  const today = new Date().toISOString().slice(0, 10)
  const [past, upcoming] = Array.partition(
    Schema.decodeUnknownSync(Schema.parseJson(Schema.Array(CommunityEvent)))(
      readContentFile('events.json')
    ),
    (event) => event.date >= today
  )
  return {
    upcoming: Array.sort(upcoming, byDate),
    past: Array.sort(past, Order.reverse(byDate)),
  }
}

export function pastEventsPageCount(): number {
  return Math.max(1, Math.ceil(splitEvents().past.length / PAGE_SIZE))
}

export function communityPagePath(page: number): string {
  return page === 1 ? '/community' : `/community/page/${page}`
}

export interface EventsPage {
  readonly upcoming: readonly CommunityEvent[]
  readonly past: readonly CommunityEvent[]
  readonly previousPage?: number
  readonly nextPage?: number
}

/** Upcoming events soonest first, then one page of past events newest first. */
export function eventsPage(page: number): EventsPage {
  const {upcoming, past} = splitEvents()
  return {
    upcoming,
    past: pipe(past, Array.drop((page - 1) * PAGE_SIZE), Array.take(PAGE_SIZE)),
    previousPage: page > 1 ? page - 1 : undefined,
    nextPage: page * PAGE_SIZE < past.length ? page + 1 : undefined,
  }
}

/** Webflow's date fields: `Fri`, `Oct`, `02`. */
export function formatEventDate(date: string): {
  readonly weekday: string
  readonly month: string
  readonly day: string
} {
  const parsed = new Date(`${date}T00:00:00Z`)
  const part = (options: Intl.DateTimeFormatOptions): string =>
    parsed.toLocaleDateString('en-US', {...options, timeZone: 'UTC'})
  return {
    weekday: part({weekday: 'short'}),
    month: part({month: 'short'}),
    day: part({day: '2-digit'}),
  }
}
