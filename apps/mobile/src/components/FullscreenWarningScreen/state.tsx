import {Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {
  type FullScreenWarning,
  type NewsAndAnnouncementsResponse,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {Array, Effect, Option, Schema} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {atom} from 'jotai'
import {apiAtom} from '../../api'
import {atomWithParsedMmkvStorage} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {ignoreReportErrors} from '../../utils/reportError'

const newsAndAnnouncementsAtom = atom<NewsAndAnnouncementsResponse | null>()

const withoutVexlBotNews = (
  response: NewsAndAnnouncementsResponse
): NewsAndAnnouncementsResponse => ({
  ...response,
  vexlBotNews: [],
})

export const fullScreenWarningDataAtom = atom(
  (get): Option.Option<FullScreenWarning> => {
    const state = get(newsAndAnnouncementsAtom)
    return Option.fromNullable(state?.fullScreenWarning).pipe(Option.flatten)
  }
)

const cancelledIdsMmkv = atomWithParsedMmkvStorage(
  'cancelledIds',
  {ids: []},
  Schema.Struct({
    ids: Schema.Array(Uuid),
  })
)

export const loadNewsAndAnnouncementsActionAtom = atom(null, (get, set) => {
  const contentApi = get(apiAtom).content

  return pipe(
    contentApi.getNewsAndAnnoucements(),
    Effect.map(withoutVexlBotNews),
    Effect.tap((response) =>
      Effect.sync(() => {
        set(newsAndAnnouncementsAtom, response)
      })
    ),
    Effect.tap((response) =>
      Effect.sync(() => {
        // remove cancelled ids from mmkv if they are no longer in the state
        const warningId = Option.getOrNull(response.fullScreenWarning)?.id
        const idsFromResponse = warningId ? [warningId] : []
        set(cancelledIdsMmkv, (prev) => ({
          ids: Array.intersection(idsFromResponse, prev.ids),
        }))
      })
    ),
    Effect.tapError((e) =>
      Effect.sync(() => {
        set(newsAndAnnouncementsAtom, null)
      })
    ),
    ignoreReportErrors('warn', 'Error loading news and announcements')
  )
})

const temporaryCancelledIdsAtom = atom<Uuid[]>([])

const cancelledIdsAtom = atom((get) => {
  const cancelledIds = get(cancelledIdsMmkv)
  const temporaryCancelledIds = get(temporaryCancelledIdsAtom)

  return [...cancelledIds.ids, ...temporaryCancelledIds]
})

export const setCancelledIdActionAtom = atom(
  undefined,
  (get, set, {id, temporary}: {id: Uuid; temporary: boolean}) => {
    if (temporary) {
      set(temporaryCancelledIdsAtom, (prev) => [...prev, id])
      return
    }

    set(cancelledIdsMmkv, (prev) => ({
      ids: [...prev.ids, id],
    }))
  }
)

export const isWarningClosedAtom = atom((get) => {
  const fullscreenWarning = get(fullScreenWarningDataAtom)
  if (Option.isNone(fullscreenWarning)) return true

  const cancelledIds = get(cancelledIdsAtom)
  return cancelledIds.includes(fullscreenWarning.value.id)
})
