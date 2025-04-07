import {type ContentApi} from '@vexl-next/rest-api/src/services/content'
import {type Event} from '@vexl-next/rest-api/src/services/content/contracts'
import day from 'dayjs'
import {Array, Effect} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {apiAtom} from '../../../../../api'
import {translationAtom} from '../../../../../utils/localization/I18nProvider'
import openUrl from '../../../../../utils/openUrl'
import reportError from '../../../../../utils/reportError'

const sortEvents = Array.sort<Event>((a, b) =>
  day(a.startDate).isAfter(day(b.startDate)) ? -1 : 1
)

type EventsState =
  | {
      state: 'loaded'
      events: readonly Event[]
    }
  | {
      state: 'initial'
      events?: readonly Event[]
    }
  | {
      state: 'loading'
      events?: readonly Event[]
    }
  | {
      state: 'error'
      error: Effect.Effect.Error<ReturnType<ContentApi['getEvents']>>
      events?: readonly Event[]
    }

const eventsStateAtom = atom<EventsState>({state: 'initial'})

export const refreshEventsActionAtom = atom(null, (get, set) => {
  const api = get(apiAtom)

  const initialState = get(eventsStateAtom)

  set(eventsStateAtom, {state: 'loading', events: initialState.events})

  api.content.getEvents().pipe(
    Effect.mapBoth({
      onSuccess: (events) => {
        set(eventsStateAtom, {state: 'loaded', events: events.events})
      },
      onFailure(e) {
        reportError('warn', new Error('Failed to load events', {cause: e}), {e})
        set(eventsStateAtom, {
          state: 'error',
          error: e,
          events: initialState.events,
        })
      },
    }),
    Effect.runFork
  )
})

export const eventsLoadingAtom = atom(
  (get) => get(eventsStateAtom).state === 'loading'
)

export const eventsLoadingErrorAtom = atom((get) => {
  const state = get(eventsStateAtom)
  if (state.state === 'error') return state.error
})

export const areThereEventsToShowAtom = atom(
  (get) => !!get(eventsStateAtom).events
)

export const eventsSortedAtom = atom((get) =>
  pipe(get(eventsStateAtom).events ?? [], sortEvents)
)

export const futureEventsAtom = atom((get) =>
  get(eventsSortedAtom)
    .filter((event) => day(event.startDate).isAfter(day().startOf('day')))
    .sort((a, b) => (day(a.startDate).isBefore(day(b.startDate)) ? -1 : 1))
)

export const pastEventsAtom = atom((get) =>
  get(eventsSortedAtom).filter((event) =>
    day(event.startDate).isBefore(day().startOf('day'))
  )
)

export const numberOfPastEventsToShowAtom = atom(6)
export const extendPastEventsActionAtom = atom(null, (get, set) => {
  set(numberOfPastEventsToShowAtom, (v) => v + 3)
})
export const areThereMorePastEventsToShowAtom = atom((get) => {
  const pastEvents = get(pastEventsAtom)
  const numberOfPastEventsToShow = get(numberOfPastEventsToShowAtom)
  return pastEvents.length > numberOfPastEventsToShow
})

export type ListData =
  | {type: 'event'; event: Event}
  | {type: 'header'; value: 'future' | 'past'; emptySection: boolean}
  | {type: 'createEvent'}
  | {type: 'morePastEvents'}
  | {type: 'allEventsLoaded'}
export const eventsForListAtom = atom<ListData[]>((get) => {
  const futureEvents = get(futureEventsAtom)
  const pastEvents = Array.take(
    get(pastEventsAtom),
    get(numberOfPastEventsToShowAtom)
  )
  const areThereMorePastEventsToShow = get(areThereMorePastEventsToShowAtom)

  return [
    {
      type: 'header' as const,
      value: 'future' as const,
      emptySection: !futureEvents.length,
    },
    ...futureEvents.map((event) => ({type: 'event' as const, event})),
    {type: 'createEvent' as const},
    {
      type: 'header' as const,
      value: 'past' as const,
      emptySection: !pastEvents.length,
    },
    ...pastEvents.map((event) => ({type: 'event' as const, event})),
    areThereMorePastEventsToShow
      ? {type: 'morePastEvents' as const}
      : {type: 'allEventsLoaded' as const},
  ]
})

export const stickyHeadersIndiciesAtom = atom((get) => {
  return get(eventsForListAtom)
    .map((item, index) => {
      if (item.type === 'header') return index
      return -1
    })
    .filter((index) => index !== -1)
})

export const eventsForListAtomsAtom = splitAtom(eventsForListAtom)

export const createEventActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)
  const emailBody = encodeURIComponent(
    `${t('events.wantToCreateEvent')}\n\n
${t('events.eventName')} (Event name):\n\n
${t('events.dateAndTime')} (Date and time):\n\n
${t('events.cityAndCountry')} (City and country):\n\n
${t('events.description')} (Description):\n\n
${t('events.linkToEvent')} (Link to event):\n\n
${t('events.contactEmail')} (Contact email):\n\n
${t('events.speakersOptional')} (Speakers - optional):\n\n`
  )

  openUrl(
    `mailto:${t('common.marketingEmailAddress')}?subject=Vexl event&body=${emailBody}`,
    t('common.marketingEmailAddress')
  )()
})
