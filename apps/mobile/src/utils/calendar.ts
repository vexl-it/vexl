import {type CalendarEventId} from '@vexl-next/domain/src/general/messaging'
import * as Calendar from 'expo-calendar'
import {
  CalendarAccessLevel,
  type Calendar as ExpoCalendar,
  type Source,
} from 'expo-calendar'
import * as E from 'fp-ts/Either'
import type * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom, type PrimitiveAtom} from 'jotai'
import {Alert, Platform} from 'react-native'
import {getTokens} from 'tamagui'
import {askAreYouSureActionAtom} from '../components/AreYouSureDialog'
import {loadingOverlayDisplayedAtom} from '../components/LoadingOverlayProvider'
import {vexlCalendarIdAtom} from '../state/tradeChecklist/atoms/vexlCalendarStorageAtom'
import {translationAtom} from './localization/I18nProvider'
import reportError from './reportError'

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
    ): TE.TaskEither<PermissionsNotGrantedError | UnknownError, string> => {
      const vexlCalendarId = get(vexlCalendarIdAtom)

      return async () => {
        try {
          const permissions = await Calendar.requestCalendarPermissionsAsync()

          if (permissions.status !== 'granted') {
            return E.left({
              _tag: 'permissionsNotGranted',
              reason: 'PermissionsNotGranted',
            })
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

            return E.right(calendarId)
          }

          const calendars = await Calendar.getCalendarsAsync()
          const calendar = calendars.find(
            (calendar) => calendar.id === vexlCalendarId
          )

          if (!calendar) {
            const calendarId = await Calendar.createCalendarAsync(vexlCalendar)
            set(vexlCalendarIdAtom, calendarId)

            return E.right(calendarId)
          }

          return E.right(calendar.id)
        } catch (error) {
          return E.left({
            _tag: 'unknown',
            reason: 'Unknown',
            error,
          })
        }
      }
    }
  )

function createCalendarEvent({
  calendarEventId,
  calendarId,
  event,
}: {
  calendarEventId: CalendarEventId | undefined
  calendarId: string
  event: TradeChecklistCalendarEvent
}): TE.TaskEither<UnknownError, CalendarEventId> {
  return async () => {
    try {
      if (calendarEventId) {
        const existingEvent = await Calendar.getEventAsync(
          calendarEventId
        ).catch(() => undefined)
        if (existingEvent) {
          await Calendar.updateEventAsync(existingEvent.id, event)
          return E.right(existingEvent.id as CalendarEventId)
        }
      }

      const eventId = await Calendar.createEventAsync(calendarId, event)
      return E.right(eventId as CalendarEventId)
    } catch (error) {
      return E.left({_tag: 'unknown', reason: 'Unknown', error})
    }
  }
}

export const addEventToCalendarActionAtom = atom(
  null,
  (
    get,
    set,
    {
      calendarEventIdAtom,
      event,
    }: {
      calendarEventIdAtom: PrimitiveAtom<CalendarEventId | undefined>
      event: TradeChecklistCalendarEvent
    }
  ): T.Task<boolean> => {
    const {t} = get(translationAtom)
    const calendarEventId = get(calendarEventIdAtom)

    set(loadingOverlayDisplayedAtom, true)

    return pipe(
      TE.Do,
      TE.bindW('calendarId', () =>
        set(
          createCalendarIfNotExistsAndTryToResolvePermissionsAlongTheWayActionAtom
        )
      ),
      (a) => a,
      TE.bindW('calendarEventId', ({calendarId}) =>
        createCalendarEvent({
          calendarEventId,
          calendarId,
          event,
        })
      ),
      TE.chainFirstW(() =>
        set(askAreYouSureActionAtom, {
          steps: [
            {
              type: 'StepWithText',
              title: t('tradeChecklist.eventAddedSuccess'),
              description: t('tradeChecklist.eventAddedSuccessDescription'),
              positiveButtonText: t('common.close'),
            },
          ],
          variant: 'info',
        })
      ),
      TE.match(
        (e) => {
          set(loadingOverlayDisplayedAtom, false)
          if (e._tag === 'permissionsNotGranted') {
            Alert.alert(t('tradeChecklist.calendarPermissionsNotGranted'))
          }

          if (e._tag === 'unknown') {
            reportError('error', new Error('Error creating calendar event'), {
              e,
            })
            Alert.alert(t('tradeChecklist.eventAddedError'))
          }

          return false
        },
        ({calendarEventId}) => {
          set(loadingOverlayDisplayedAtom, false)
          set(calendarEventIdAtom, calendarEventId)
          return true
        }
      )
    )
  }
)
