'use client'

import {
  CmsListPage,
  OpenLinkAction,
  type CmsColumn,
  type CmsView,
} from '@/src/components/cms/CmsListPage'
import {Badge} from '@/src/components/ui'
import {formatDateTime} from '@/src/services/cms/dateTimeLocal'
import {eventResource} from '@/src/services/cms/resources'
import {type CmsEvent} from '@vexl-next/domain/src/general/cms'
import {Array, Option, Order, pipe} from 'effect'
import Link from 'next/link'

const endOf = (event: CmsEvent): Date =>
  Option.getOrElse(event.endDate, () => event.startDate)

const hasEnded = (event: CmsEvent): boolean =>
  endOf(event).getTime() < Date.now()

function Timing({event}: {readonly event: CmsEvent}) {
  if (hasEnded(event)) return <Badge>Past</Badge>
  return event.startDate.getTime() > Date.now() ? (
    <Badge tone="info">Upcoming</Badge>
  ) : (
    <Badge tone="success">Happening now</Badge>
  )
}

const isWebLink = (link: string): boolean => /^https?:\/\//i.test(link)

const COLUMNS: ReadonlyArray<CmsColumn<CmsEvent>> = [
  {
    header: 'Event',
    order: Order.mapInput(Order.string, (event) => event.name.toLowerCase()),
    render: (event, editHref) => (
      <div className="w-56 sm:w-64 2xl:w-96">
        <Link
          href={editHref}
          className="line-clamp-2 font-medium text-ink hover:underline"
        >
          {event.name}
        </Link>
        <div className="mt-0.5 flex items-center gap-2">
          {event.goldenGlasses ? (
            <Badge tone="accent">Golden glasses</Badge>
          ) : null}
          <span className="truncate text-xs text-ink-muted">{event.venue}</span>
        </div>
      </div>
    ),
  },
  {
    header: 'Date',
    order: Order.mapInput(Order.Date, (event) => event.startDate),
    render: (event) => (
      <div className="whitespace-nowrap">
        <div className="flex items-center gap-2">
          {formatDateTime(event.startDate)}
          <Timing event={event} />
        </div>
        {Option.match(event.endDate, {
          onNone: () => null,
          onSome: (endDate) => (
            <div className="mt-0.5 text-xs text-ink-subtle">
              until {formatDateTime(endDate)}
            </div>
          ),
        })}
      </div>
    ),
  },
  {
    header: 'Speakers',
    render: (event) =>
      Array.isNonEmptyReadonlyArray(event.speakers) ? (
        <div className="flex w-44 items-center gap-2">
          {pipe(
            event.speakers,
            Array.filterMap((speaker) => speaker.imageUrl),
            Array.take(3),
            Array.match({
              onEmpty: () => null,
              onNonEmpty: (photos) => (
                <div className="flex shrink-0 -space-x-2">
                  {Array.map(photos, (imageUrl, index) => (
                    <img
                      key={index}
                      src={imageUrl}
                      alt=""
                      loading="lazy"
                      className="size-7 rounded-full bg-canvas object-cover ring-2 ring-surface"
                    />
                  ))}
                </div>
              ),
            })
          )}
          <span className="line-clamp-2 text-xs text-ink-muted">
            {Array.map(event.speakers, (speaker) => speaker.name).join(', ')}
          </span>
        </div>
      ) : (
        <span className="text-ink-subtle">–</span>
      ),
  },
]

const VIEWS: ReadonlyArray<CmsView<CmsEvent>> = [
  {label: 'Upcoming', matches: (event) => !hasEnded(event)},
  {label: 'Past', matches: hasEnded},
]

export default function EventsPage() {
  return (
    <CmsListPage
      resource={eventResource}
      title="Events"
      description="Meetups and conferences listed on the Vexl website and in the app."
      columns={COLUMNS}
      views={VIEWS}
      defaultSort={{key: 'Date', descending: true}}
      rowAction={(event) =>
        isWebLink(event.link) ? (
          <OpenLinkAction href={event.link} label="Open the event's website" />
        ) : null
      }
    />
  )
}
