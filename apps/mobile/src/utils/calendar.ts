import {CalendarEventId} from '@vexl-next/domain/src/general/messaging'
import {tokens} from '@vexl-next/ui'
import {Array, Option, pipe, Schema} from 'effect/index'
import {
  CalendarAccessLevel,
  createCalendarAsync,
  createEventAsync,
  EntityTypes,
  getCalendarsAsync,
  getDefaultCalendarAsync,
  getEventAsync,
  requestCalendarPermissionsAsync,
  updateEventAsync,
  type Calendar,
  type Source,
} from 'expo-calendar'
import {left, right} from 'fp-ts/Either'
import {type TaskEither} from 'fp-ts/TaskEither'
import {atom} from 'jotai'
import {Platform} from 'react-native'
import {vexlCalendarIdAtom} from '../state/tradeChecklist/atoms/vexlCalendarStorageAtom'

const CALENDAR_TITLE = 'Vexl'

type CalendarEventIdType = typeof CalendarEventId.Type

export interface PermissionsNotGrantedError {
  _tag: 'permissionsNotGranted'
  reason: 'PermissionsNotGranted'
  error?: unknown
}

export interface UnknownError {
  _tag: 'unknown'
  reason: 'Unknown'
  error?: unknown
}

export interface TradeChecklistCalendarEvent {
  title: string
  startDate: Date
  endDate: Date
  location?: string
  notes?: string
}

export const createCalendarIfNotExistsAndTryToResolvePermissionsAlongTheWayActionAtom =
  atom(
    null,
    (
      get,
      set
    ): TaskEither<PermissionsNotGrantedError | UnknownError, string> => {
      const vexlCalendarId = get(vexlCalendarIdAtom)

      return async () => {
        try {
          const permissions = await requestCalendarPermissionsAsync()

          if (permissions.status !== 'granted') {
            return left({
              _tag: 'permissionsNotGranted',
              reason: 'PermissionsNotGranted',
            })
          }

          const defaultCalendarSource: Source =
            Platform.OS === 'ios'
              ? await getDefaultCalendarAsync().then((result) => result.source)
              : {
                  isLocalAccount: true,
                  name: CALENDAR_TITLE,
                  type: 'LOCAL',
                }

          const vexlCalendar = {
            title: CALENDAR_TITLE,
            name: CALENDAR_TITLE,
            allowsModifications: true,
            isSynced: true,
            isPrimary: false,
            accessLevel: CalendarAccessLevel.OWNER,
            entityType: EntityTypes.EVENT,
            sourceId: defaultCalendarSource.id,
            source: defaultCalendarSource,
            ownerAccount: 'personal',
            color: tokens.color.yellow100.val,
          } satisfies Partial<Calendar>

          if (Option.isNone(vexlCalendarId)) {
            const calendarId = await createCalendarAsync(vexlCalendar)
            set(vexlCalendarIdAtom, Option.some(calendarId))

            return right(calendarId)
          }

          const calendars = await getCalendarsAsync()
          const calendar = pipe(
            calendars,
            Array.findFirst((calendar) => calendar.id === vexlCalendarId.value)
          )

          if (Option.isNone(calendar)) {
            const calendarId = await createCalendarAsync(vexlCalendar)
            set(vexlCalendarIdAtom, Option.some(calendarId))

            return right(calendarId)
          }

          return right(calendar.value.id)
        } catch (error) {
          return left({
            _tag: 'unknown',
            reason: 'Unknown',
            error,
          })
        }
      }
    }
  )

export function createCalendarEvent({
  calendarEventId,
  calendarId,
  event,
}: {
  calendarEventId: CalendarEventIdType | undefined
  calendarId: string
  event: TradeChecklistCalendarEvent
}): TaskEither<
  UnknownError,
  {calendarEventId: CalendarEventIdType; action: 'created' | 'updated'}
> {
  return async () => {
    try {
      if (calendarEventId) {
        const existingEvent = await getEventAsync(calendarEventId).catch(
          () => undefined
        )
        if (existingEvent) {
          await updateEventAsync(existingEvent.id, event)
          return right({
            calendarEventId: Schema.decodeSync(CalendarEventId)(
              existingEvent.id
            ),
            action: 'updated',
          })
        }
      }

      const eventId = await createEventAsync(calendarId, event)
      return right({
        calendarEventId: Schema.decodeSync(CalendarEventId)(eventId),
        action: 'created',
      })
    } catch (error) {
      return left({_tag: 'unknown', reason: 'Unknown', error})
    }
  }
}
