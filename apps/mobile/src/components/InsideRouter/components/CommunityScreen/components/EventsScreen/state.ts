import {type Event} from '@vexl-next/rest-api/src/services/content/contracts'
import dayjs from 'dayjs'
import {Array, Effect, Option, Order, pipe} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../../../../api'
import {translationAtom} from '../../../../../../utils/localization/I18nProvider'
import openUrl from '../../../../../../utils/openUrl'
import reportError from '../../../../../../utils/reportError'

interface EventsState {
  readonly loading: boolean
  readonly data: Option.Option<readonly Event[]>
  readonly error: Option.Option<unknown>
}

const emptyEvents: readonly Event[] = []

function getEventsOrEmpty(
  events: Option.Option<readonly Event[]>
): readonly Event[] {
  return Option.getOrElse(events, () => emptyEvents)
}

const sortUpcomingEvents = Array.sortWith(
  (event: Event) => event.startDate,
  Order.Date
)

const sortPastEvents = Array.sortWith(
  (event: Event) => event.startDate,
  Order.reverse(Order.Date)
)

export const eventsStateAtom = atom<EventsState>({
  loading: false,
  data: Option.none(),
  error: Option.none(),
})

export const loadEventsActionAtom = atom(null, async (get, set) => {
  await Effect.gen(function* (_) {
    const api = get(apiAtom)

    set(eventsStateAtom, (prev) => ({
      ...prev,
      loading: true,
      error: Option.none(),
    }))

    yield* _(
      api.content.getEvents(),
      Effect.match({
        onFailure: (e) => {
          reportError('warn', new Error('Failed to load events', {cause: e}), {
            e,
          })
          set(eventsStateAtom, (prev) => ({
            ...prev,
            loading: false,
            error: Option.some(e),
          }))
        },
        onSuccess: ({events}) => {
          set(eventsStateAtom, {
            loading: false,
            data: Option.some(events),
            error: Option.none(),
          })
        },
      })
    )
  }).pipe(Effect.runPromise)
})

export const upcomingEventsAtom = atom((get) =>
  pipe(
    getEventsOrEmpty(get(eventsStateAtom).data),
    Array.filter((event) =>
      dayjs(event.startDate).isAfter(dayjs().startOf('day'))
    ),
    sortUpcomingEvents
  )
)

export const pastEventsAtom = atom((get) =>
  pipe(
    getEventsOrEmpty(get(eventsStateAtom).data),
    Array.filter((event) =>
      dayjs(event.startDate).isBefore(dayjs().startOf('day'))
    ),
    sortPastEvents
  )
)

export const createEventActionAtom = atom(null, (get) => {
  const {t} = get(translationAtom)
  // SHOULD INCLUDE HARDCODED TEXT SO WE CAN UNDERSTAND IT'S PURPOSE WITHOUT TRANSLATION, AND ALSO TO MAKE IT EASIER TO TEST
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
    `mailto:${t('common.marketingEmailAddress')}?subject=${encodeURIComponent(t('events.emailSubject'))}&body=${emailBody}`,
    t('common.marketingEmailAddress')
  )()
})
