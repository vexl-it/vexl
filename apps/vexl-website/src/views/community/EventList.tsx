import React from 'react'
import {type CommunityEvent, formatEventDate} from './events'

function EventItem({
  event,
}: {
  readonly event: CommunityEvent
}): React.JSX.Element {
  const {weekday, month, day} = formatEventDate(event.date)
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
            href={event.url}
            className="date-place-upcomming name-and-link w-inline-block"
          >
            {event.showGlasses ? (
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
            {event.speakers ? (
              <div className="info-past">
                <div className="event-past-text">{event.speakers}</div>
              </div>
            ) : null}
            <div className="info-past">
              <div className="event-past-text">{event.location}</div>
            </div>
            <div className="info-past">
              <div className="event-past-text">{event.start}</div>
              {event.end ? (
                <>
                  <div className="event-past-text spacer">-</div>
                  <div className="event-past-text">{event.end}</div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface PageLink {
  readonly href: string
  readonly label: string
}

/** A Webflow CMS list of events with its empty state and pagination. */
export function EventList({
  events,
  emptyText,
  previous,
  next,
}: {
  readonly events: readonly CommunityEvent[]
  readonly emptyText: string
  readonly previous?: PageLink
  readonly next?: PageLink
}): React.JSX.Element {
  return (
    <div className="w-dyn-list">
      {events.length > 0 ? (
        <div role="list" className="w-dyn-items">
          {events.map((event) => (
            <EventItem key={`${event.date} ${event.name}`} event={event} />
          ))}
        </div>
      ) : (
        <div className="empty-state-2 w-dyn-empty">
          <div className="text-block-14">{emptyText}</div>
        </div>
      )}
      <div role="navigation" aria-label="List" className="w-pagination-wrapper">
        {previous ? (
          <a
            href={previous.href}
            aria-label="Previous Page"
            className="w-pagination-previous previous-2"
          >
            <div className="text-block-16 w-inline-block">{previous.label}</div>
          </a>
        ) : null}
        {next ? (
          <a
            href={next.href}
            aria-label="Next Page"
            className="w-pagination-next next-2"
          >
            <div className="text-block-15 w-inline-block">
              {next.label}
              <br />
            </div>
          </a>
        ) : null}
      </div>
    </div>
  )
}
