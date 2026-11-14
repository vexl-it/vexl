import {type CmsEvent} from '@vexl-next/domain/src/general/cms'
import {Array, Order, pipe} from 'effect'
import {loadPublishedEvents} from '../../content/contentService'

const PAGE_SIZE = 5
/** The CMS stores instants; the live site showed them in Prague time. */
const TIME_ZONE = 'Europe/Prague'

const byStart = Order.mapInput(Order.Date, (event: CmsEvent) => event.startDate)

/** `YYYY-MM-DD` in Prague. */
const pragueDay = (date: Date): string =>
  date.toLocaleDateString('en-CA', {timeZone: TIME_ZONE})

export function pastEventsPageCount(past: readonly CmsEvent[]): number {
  return Math.max(1, Math.ceil(past.length / PAGE_SIZE))
}

export function communityPagePath(page: number): string {
  return page === 1 ? '/community' : `/community/page/${page}`
}

export interface Events {
  /** Soonest first; events starting today count as upcoming. */
  readonly upcoming: readonly CmsEvent[]
  /** Newest first. */
  readonly past: readonly CmsEvent[]
}

export async function loadEvents(): Promise<Events> {
  const today = pragueDay(new Date())
  const [past, upcoming] = Array.partition(
    await loadPublishedEvents(),
    (event) => pragueDay(event.startDate) >= today
  )
  return {
    upcoming: Array.sort(upcoming, byStart),
    past: Array.sort(past, Order.reverse(byStart)),
  }
}

export interface EventsPage {
  readonly upcoming: readonly CmsEvent[]
  readonly past: readonly CmsEvent[]
  readonly previousPage?: number
  readonly nextPage?: number
}

/** Upcoming events, then one page of past events. */
export function eventsPage({upcoming, past}: Events, page: number): EventsPage {
  return {
    upcoming,
    past: pipe(past, Array.drop((page - 1) * PAGE_SIZE), Array.take(PAGE_SIZE)),
    previousPage: page > 1 ? page - 1 : undefined,
    nextPage: page * PAGE_SIZE < past.length ? page + 1 : undefined,
  }
}

/** Webflow's date fields: `Fri`, `Oct`, `02`. */
export function formatEventDate(date: Date): {
  readonly weekday: string
  readonly month: string
  readonly day: string
} {
  const part = (options: Intl.DateTimeFormatOptions): string =>
    date.toLocaleDateString('en-US', {...options, timeZone: TIME_ZONE})
  return {
    weekday: part({weekday: 'short'}),
    month: part({month: 'short'}),
    day: part({day: '2-digit'}),
  }
}

/** `9:00` */
export function formatEventTime(date: Date): string {
  return date.toLocaleTimeString('cs-CZ', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  })
}
