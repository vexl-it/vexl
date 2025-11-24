import {type CalendarEventId} from '@vexl-next/domain/src/general/messaging'
import {Effect} from 'effect'
import * as Calendar from 'expo-calendar'
import {
  CalendarAccessLevel,
  type Calendar as ExpoCalendar,
  type Source,
} from 'expo-calendar'
import {atom} from 'jotai'
import {Platform} from 'react-native'
import {getTokens} from 'tamagui'
import {vexlCalendarIdAtom} from '../state/tradeChecklist/atoms/vexlCalendarStorageAtom'

const CALENDAR_TITLE = 'Vexl'

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
    ): Effect.Effect<string, PermissionsNotGrantedError | UnknownError> => {
      const vexlCalendarId = get(vexlCalendarIdAtom)

      return Effect.tryPromise({
        try: async () => {
          const permissions = await Calendar.requestCalendarPermissionsAsync()

          if (permissions.status !== 'granted') {
            throw {
              _tag: 'permissionsNotGranted',
              reason: 'PermissionsNotGranted',
            }
          }

          const defaultCalendarSource =
            Platform.OS === 'ios'
              ? await Calendar.getDefaultCalendarAsync().then(
                  (result) => result.source
                )
              : ({isLocalAccount: true, name: CALENDAR_TITLE} as Source)

          const vexlCalendar = {
            title: CALENDAR_TITLE,
            name: CALENDAR_TITLE,
            allowsModifications: true,
            isSynced: true,
            isPrimary: false,
            accessLevel: CalendarAccessLevel.OWNER,
            entityType: Calendar.EntityTypes.EVENT,
            sourceId: defaultCalendarSource.id,
            source: defaultCalendarSource,
            ownerAccount: 'personal',
            color: getTokens().color.main.val,
          } satisfies Partial<ExpoCalendar>

          if (!vexlCalendarId) {
            const calendarId = await Calendar.createCalendarAsync(vexlCalendar)
            set(vexlCalendarIdAtom, calendarId)

            return calendarId
          }

          const calendars = await Calendar.getCalendarsAsync()
          const calendar = calendars.find(
            (calendar) => calendar.id === vexlCalendarId
          )

          if (!calendar) {
            const calendarId = await Calendar.createCalendarAsync(vexlCalendar)
            set(vexlCalendarIdAtom, calendarId)

            return calendarId
          }

          return calendar.id
        },
        catch: (error) => {
          if (
            typeof error === 'object' &&
            error !== null &&
            '_tag' in error &&
            error._tag === 'permissionsNotGranted'
          ) {
            return error as PermissionsNotGrantedError
          }

          return {
            _tag: 'unknown',
            reason: 'Unknown',
            error,
          } as UnknownError
        },
      })
    }
  )

export function createCalendarEvent({
  calendarEventId,
  calendarId,
  event,
}: {
  calendarEventId: CalendarEventId | undefined
  calendarId: string
  event: TradeChecklistCalendarEvent
}): Effect.Effect<
  {calendarEventId: CalendarEventId; action: 'created' | 'updated'},
  UnknownError
> {
  return Effect.tryPromise({
    try: async () => {
      if (calendarEventId) {
        const existingEvent = await Calendar.getEventAsync(
          calendarEventId
        ).catch(() => undefined)
        if (existingEvent) {
          await Calendar.updateEventAsync(existingEvent.id, event)
          return {
            calendarEventId: existingEvent.id as CalendarEventId,
            action: 'updated' as const,
          }
        }
      }

      const eventId = await Calendar.createEventAsync(calendarId, event)
      return {
        calendarEventId: eventId as CalendarEventId,
        action: 'created' as const,
      }
    },
    catch: (error) => ({_tag: 'unknown', reason: 'Unknown', error}) as const,
  })
}
