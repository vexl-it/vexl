import {VexlProductNotificationUuid} from '@vexl-next/domain/src/general/vexlProductNotification'
import {Array, Effect, Option, Schema} from 'effect/index'
import {atom} from 'jotai'
import {addNotificationToCenterActionAtom} from '.'
import {apiAtom} from '../../../api'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import reportError from '../../../utils/reportError'

const VexlProductNotificationsCursorRecord = Schema.Struct({
  lastFetchedId: Schema.optionalWith(VexlProductNotificationUuid, {
    as: 'Option',
  }),
  // This should be set to a date from which on we want to fetch notifications.
  // This will automatically be set when user first uses notifications and should not be chagned,
  // but it should be used  when calling getVexlProductNotifications endpoint to make sure we fetch all notifications that were created
  // since the user first used notifications.
  //
  // If we omit this, all historic notificaitons will be fetched, we don't want that. We want to fetch
  // only notifications that were created since the user first used notifications, and we consider that date
  // to be the date when cursor was created for the first time, so we set it to current date when it's not provided.
  activeSince: Schema.optionalWith(Schema.DateFromString, {
    default: () => new Date(),
  }),
})

type VexlProductNotificationsCursorRecord =
  typeof VexlProductNotificationsCursorRecord.Type

const vexlProductNotificationsCursorAtom = atomWithParsedMmkvStorage(
  'vexlProductNotificationsCursor',
  {
    lastFetchedId: Option.none(),
    activeSince: new Date(),
  },
  VexlProductNotificationsCursorRecord
)

type VexlProductNotificationsFetchState =
  | {
      state: 'initial'
    }
  | {
      state: 'loading'
    }
  | {
      state: 'loaded'
    }
  | {
      state: 'error'
      error: unknown
    }

const vexlProductNotificationsFetchStateAtom =
  atom<VexlProductNotificationsFetchState>({
    state: 'initial',
  })

export const areVexlProductNotificationsLoadingAtom = atom(
  (get) => get(vexlProductNotificationsFetchStateAtom).state === 'loading'
)

export const vexlProductNotificationsLoadingErrorAtom = atom((get) => {
  const state = get(vexlProductNotificationsFetchStateAtom)
  if (state.state === 'error') return state.error
})

export const fetchVexlProductNotificationsActionAtom = atom(null, (get, set) =>
  Effect.gen(function* (_) {
    if (get(vexlProductNotificationsFetchStateAtom).state === 'loading') return

    const contentApi = get(apiAtom).content
    const cursor = get(vexlProductNotificationsCursorAtom)

    set(vexlProductNotificationsFetchStateAtom, {state: 'loading'})

    const response = yield* _(
      contentApi.getVexlProductNotifications({
        newerThan: cursor.activeSince,
        lastVexlProductNotificationUuidFetched: Option.getOrUndefined(
          cursor.lastFetchedId
        ),
      }),
      Effect.match({
        onFailure: (e) => {
          reportError(
            'warn',
            new Error('Failed to load Vexl product notifications', {cause: e}),
            {e}
          )
          set(vexlProductNotificationsFetchStateAtom, {
            state: 'error',
            error: e,
          })
          return Option.none()
        },
        onSuccess: Option.some,
      })
    )

    if (Option.isNone(response)) return
    const fetchedNotifications = response.value.vexlProductNotifications
    if (!Array.isNonEmptyReadonlyArray(fetchedNotifications)) {
      set(vexlProductNotificationsFetchStateAtom, {state: 'loaded'})
      return
    }

    yield* _(
      fetchedNotifications,
      Array.map((productNotification) =>
        Effect.sync(() => {
          set(addNotificationToCenterActionAtom, {
            _tag: 'VexlProductNotificationData',
            productNotification,
          })
        })
      ),
      Effect.all
    )

    const lastFetchedNotification = Array.lastNonEmpty(fetchedNotifications)

    const updatedCursor: VexlProductNotificationsCursorRecord = {
      activeSince: cursor.activeSince,
      lastFetchedId: Option.some(lastFetchedNotification.uuid),
    }

    set(vexlProductNotificationsCursorAtom, updatedCursor)
    set(vexlProductNotificationsFetchStateAtom, {state: 'loaded'})
  })
)
