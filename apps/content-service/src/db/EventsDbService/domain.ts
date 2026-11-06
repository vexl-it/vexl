import {
  CmsStatus,
  EventId,
  Speaker,
  type CmsEvent,
  type EventInput,
} from '@vexl-next/domain/src/general/cms'
import {Option, Schema} from 'effect'

export const EventDbRecord = Schema.Struct({
  id: EventId,
  status: CmsStatus,
  name: Schema.String,
  venue: Schema.String,
  link: Schema.String,
  startDate: Schema.DateFromSelf,
  endDate: Schema.NullOr(Schema.DateFromSelf),
  goldenGlasses: Schema.Boolean,
  speakers: Schema.Array(Speaker),
})
export type EventDbRecord = typeof EventDbRecord.Type

export const eventFromDbRecord = (record: EventDbRecord): CmsEvent => ({
  ...record,
  endDate: Option.fromNullable(record.endDate),
})

export const eventContentColumns = (
  event: EventInput
): {
  name: string
  venue: string
  link: string
  startDate: Date
  endDate: Date | null
  goldenGlasses: boolean
  speakersJson: string
} => ({
  name: event.name,
  venue: event.venue,
  link: event.link,
  startDate: event.startDate,
  endDate: Option.getOrNull(event.endDate),
  goldenGlasses: event.goldenGlasses,
  speakersJson: JSON.stringify(
    Schema.encodeSync(Schema.Array(Speaker))(event.speakers)
  ),
})
