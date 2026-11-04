import {Array, Order, Schema} from 'effect'
import {readContentFile} from './files'

const CommunityEvent = Schema.Struct({
  date: Schema.String.pipe(Schema.pattern(/^\d{4}-\d{2}-\d{2}$/)),
  name: Schema.String,
  url: Schema.optional(Schema.String),
  location: Schema.String,
  speakers: Schema.optional(Schema.String),
  time: Schema.optional(Schema.String),
})
export type CommunityEvent = typeof CommunityEvent.Type

const byDate = Order.mapInput(
  Order.string,
  (event: CommunityEvent) => event.date
)

export interface CommunityEvents {
  readonly upcoming: readonly CommunityEvent[]
  readonly past: readonly CommunityEvent[]
}

/** Splits events by the build date, so upcoming events move to past on the next build. */
export function getCommunityEvents(today: string): CommunityEvents {
  const events = Schema.decodeUnknownSync(Schema.Array(CommunityEvent))(
    JSON.parse(readContentFile('events.json'))
  )
  const [past, upcoming] = Array.partition(
    events,
    (event) => event.date >= today
  )
  return {
    upcoming: Array.sort(upcoming, byDate),
    past: Array.sort(past, Order.reverse(byDate)),
  }
}
