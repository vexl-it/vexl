import {type CmsEvent} from '@vexl-next/domain/src/general/cms'
import {Array, Option, pipe} from 'effect'
import React from 'react'
import {type PageCopy} from '../../copy/pageCopy'
import {formatEventDate, formatEventTime} from './events'

function EventItem({event}: {readonly event: CmsEvent}): React.JSX.Element {
  const {weekday, month, day} = formatEventDate(event.startDate)
  const speakers = pipe(
    event.speakers,
    Array.map((speaker) => speaker.name),
    Array.join(', ')
  )
  return (
    <div role="listitem" className="w-dyn-item">
      <div className="past_event">
        <div className="when">
          <div className="date-place-upcomming">
            <div className="info-event-past">{weekday}</div>
            <div className="info-event-past">,</div>
            <div className="info-event-past spacer" />
            <div className="info-event-past">{month}</div>
            <div className="info-event-past spacer" />
            <div className="info-event-past">{day}</div>
          </div>
          <a
            href={event.link}
            className="date-place-upcomming name-and-link w-inline-block"
          >
            {event.goldenGlasses ? (
              <img
                src="/wf/67c6d9feb725232e1f3b3f16_Group-687.png"
                loading="lazy"
                width={33}
                height={15}
                alt=""
                className="image-22"
              />
            ) : null}
            <div className="info-event-past">{event.name}</div>
            <img
              loading="lazy"
              src="/wf/668532e78fff0b7f7b36c433_external-link_White.svg"
              alt=""
              className="image-18"
            />
          </a>
        </div>
        <div className="div-block-50">
          <div className="div-block-49">
            {speakers ? (
              <div className="info-past">
                <div className="event-past-text">{speakers}</div>
              </div>
            ) : null}
            <div className="info-past">
              <div className="event-past-text">{event.venue}</div>
            </div>
            <div className="info-past">
              <div className="event-past-text">
                {formatEventTime(event.startDate)}
              </div>
              {Option.match(event.endDate, {
                onNone: () => null,
                onSome: (endDate) => (
                  <>
                    <div className="event-past-text spacer">-</div>
                    <div className="event-past-text">
                      {formatEventTime(endDate)}
                    </div>
                  </>
                ),
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** A Webflow CMS list of events with its empty state and pagination. */
export function EventList({
  events,
  t,
  previousHref,
  nextHref,
}: {
  readonly events: readonly CmsEvent[]
  readonly t: PageCopy<'community'>
  readonly previousHref?: string
  readonly nextHref?: string
}): React.JSX.Element {
  return (
    <div className="w-dyn-list">
      {events.length > 0 ? (
        <div role="list" className="w-dyn-items">
          {events.map((event) => (
            <EventItem key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="empty-state-2 w-dyn-empty">
          <div className="text-block-14">{t('events.empty')}</div>
        </div>
      )}
      <div
        role="navigation"
        {...t.attr('aria-label', 'events.paginationLabel')}
        className="w-pagination-wrapper"
      >
        {previousHref ? (
          <a
            href={previousHref}
            {...t.attr('aria-label', 'events.previousPageLabel')}
            className="w-pagination-previous previous-2"
          >
            <div className="text-block-16 w-inline-block">
              {t('events.showNewer')}
            </div>
          </a>
        ) : null}
        {nextHref ? (
          <a
            href={nextHref}
            {...t.attr('aria-label', 'events.nextPageLabel')}
            className="w-pagination-next next-2"
          >
            <div className="text-block-15 w-inline-block">
              {t('events.showOlder')}
              <br />
            </div>
          </a>
        ) : null}
      </div>
    </div>
  )
}
