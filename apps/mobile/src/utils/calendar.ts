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
  openEventInCalendarAsync,
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
const DEFAULT_TRADE_CHECKLIST_EVENT_DURATION_MS = 60 * 60 * 1000

type CalendarEventIdType = typeof CalendarEventId.Type
type CalendarIdResolutionResult =
  | {calendarId: string; isVexlCalendar: true}
  | {calendarId: string; isVexlCalendar: false}

const NativeCalendarErrorDetails = Schema.Struct({
  code: Schema.optional(Schema.String),
  message: Schema.optional(Schema.String),
  name: Schema.optional(Schema.String),
})

type NativeCalendarErrorDetailsType = typeof NativeCalendarErrorDetails.Type

function getNativeCalendarErrorDetails(
  error: unknown
): NativeCalendarErrorDetailsType | undefined {
  return Option.getOrUndefined(
    Schema.decodeUnknownOption(NativeCalendarErrorDetails)(error)
  )
}

async function createVexlCalendarOrFallbackToDefaultCalendar({
  defaultCalendar,
  vexlCalendar,
}: {
  defaultCalendar: Calendar | undefined
  vexlCalendar: Partial<Calendar>
}): Promise<CalendarIdResolutionResult> {
  try {
    return {
      calendarId: await createCalendarAsync(vexlCalendar),
      isVexlCalendar: true,
    }
  } catch (error) {
    if (Platform.OS === 'ios' && defaultCalendar?.allowsModifications) {
      return {calendarId: defaultCalendar.id, isVexlCalendar: false}
    }

    throw error
  }
}

export interface PermissionsNotGrantedError {
  _tag: 'permissionsNotGranted'
  reason: 'PermissionsNotGranted'
  error?: unknown
}

export interface UnknownError {
  _tag: 'unknown'
  reason: 'Unknown'
  operation?: string
  errorDetails?: NativeCalendarErrorDetailsType
  error?: unknown
}

export interface TradeChecklistCalendarEvent {
  title: string
  startDate: Date
  endDate: Date
  location?: string
  notes?: string
}

export function ensureTradeChecklistCalendarEventHasDuration(
  event: TradeChecklistCalendarEvent
): TradeChecklistCalendarEvent {
  if (event.endDate.getTime() > event.startDate.getTime()) return event

  return {
    ...event,
    endDate: new Date(
      event.startDate.getTime() + DEFAULT_TRADE_CHECKLIST_EVENT_DURATION_MS
    ),
  }
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
        let operation = 'requestCalendarPermissionsAsync'

        try {
          const permissions = await requestCalendarPermissionsAsync()

          if (permissions.status !== 'granted') {
            return left({
              _tag: 'permissionsNotGranted',
              reason: 'PermissionsNotGranted',
            })
          }

          operation =
            Platform.OS === 'ios'
              ? 'getDefaultCalendarAsync'
              : 'resolveAndroidLocalCalendarSource'

          const defaultCalendar =
            Platform.OS === 'ios' ? await getDefaultCalendarAsync() : undefined

          const defaultCalendarSource: Source = defaultCalendar?.source ?? {
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
            operation = 'createCalendarAsync'
            const {calendarId, isVexlCalendar} =
              await createVexlCalendarOrFallbackToDefaultCalendar({
                defaultCalendar,
                vexlCalendar,
              })

            if (isVexlCalendar) set(vexlCalendarIdAtom, Option.some(calendarId))

            return right(calendarId)
          }

          operation = 'getCalendarsAsync(EVENT)'
          const calendars = await getCalendarsAsync(EntityTypes.EVENT)
          const calendar = pipe(
            calendars,
            Array.findFirst((calendar) => calendar.id === vexlCalendarId.value)
          )

          if (Option.isNone(calendar)) {
            operation = 'createCalendarAsync'
            const {calendarId, isVexlCalendar} =
              await createVexlCalendarOrFallbackToDefaultCalendar({
                defaultCalendar,
                vexlCalendar,
              })

            if (isVexlCalendar) set(vexlCalendarIdAtom, Option.some(calendarId))

            return right(calendarId)
          }

          if (Platform.OS === 'ios' && !calendar.value.allowsModifications) {
            return defaultCalendar?.allowsModifications
              ? right(defaultCalendar.id)
              : right(calendar.value.id)
          }

          return right(calendar.value.id)
        } catch (error) {
          return left({
            _tag: 'unknown',
            reason: 'Unknown',
            operation,
            errorDetails: getNativeCalendarErrorDetails(error),
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
    let operation = 'ensureTradeChecklistCalendarEventHasDuration'

    try {
      const eventWithDuration =
        ensureTradeChecklistCalendarEventHasDuration(event)

      if (calendarEventId) {
        operation = 'getEventAsync'
        const existingEvent = await getEventAsync(calendarEventId).catch(
          () => undefined
        )
        if (existingEvent) {
          operation = 'updateEventAsync'
          await updateEventAsync(existingEvent.id, eventWithDuration)
          return right({
            calendarEventId: Schema.decodeSync(CalendarEventId)(
              existingEvent.id
            ),
            action: 'updated',
          })
        }
      }

      operation = 'createEventAsync'
      const eventId = await createEventAsync(calendarId, eventWithDuration)
      return right({
        calendarEventId: Schema.decodeSync(CalendarEventId)(eventId),
        action: 'created',
      })
    } catch (error) {
      return left({
        _tag: 'unknown',
        reason: 'Unknown',
        operation,
        errorDetails: getNativeCalendarErrorDetails(error),
        error,
      })
    }
  }
}

export function openCalendarEvent(
  calendarEventId: CalendarEventIdType
): TaskEither<UnknownError, void> {
  return async () => {
    try {
      await openEventInCalendarAsync({id: calendarEventId})
      return right(undefined)
    } catch (error) {
      return left({
        _tag: 'unknown',
        reason: 'Unknown',
        operation: 'openEventInCalendarAsync',
        errorDetails: getNativeCalendarErrorDetails(error),
        error,
      })
    }
  }
}
