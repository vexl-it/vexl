import {type Uuid, UuidE} from '@vexl-next/domain/src/utility/Uuid.brand'
import {
  type FullScreenWarning,
  type NewsAndAnnouncementsResponse,
  type VexlBotNews,
} from '@vexl-next/rest-api/src/services/content/contracts'
import {Array, Effect, Option, Schema} from 'effect'
import {pipe} from 'fp-ts/lib/function'
import {atom, type WritableAtom} from 'jotai'
import {apiAtom} from '../../api'
import {atomWithParsedMmkvStorageE} from '../../utils/atomUtils/atomWithParsedMmkvStorageE'
import {ignoreReportErrors} from '../../utils/reportError'

const newsAndAnnouncementsAtom = atom<NewsAndAnnouncementsResponse | null>()

export const fullScreenWarningDataAtom = atom(
  (get): Option.Option<FullScreenWarning> => {
    const state = get(newsAndAnnouncementsAtom)
    return Option.fromNullable(state?.fullScreenWarning).pipe(Option.flatten)
  }
)

export const announcmentsAtom = atom(
  (get): Option.Option<Array.NonEmptyReadonlyArray<VexlBotNews>> => {
    const state = get(newsAndAnnouncementsAtom)
    const vexlBotNews = state?.vexlBotNews

    if (vexlBotNews && Array.isNonEmptyReadonlyArray(vexlBotNews))
      return Option.some(vexlBotNews)

    return Option.none()
  }
)

const cancelledIdsMmkv = atomWithParsedMmkvStorageE(
  'cancelledIds',
  {ids: []},
  Schema.Struct({
    ids: Schema.Array(UuidE),
  })
)

export const loadNewsAndAnnouncementsActionAtom = atom(null, (get, set) => {
  const contentApi = get(apiAtom).content

  return pipe(
    contentApi.getNewsAndAnnoucements(),
    Effect.tap((response) =>
      Effect.sync(() => {
        set(newsAndAnnouncementsAtom, response)
      })
    ),
    Effect.tap((response) =>
      Effect.sync(() => {
        // remove cancelled ids from mmkv if they are no longer in the state
        const warningId = Option.getOrNull(response.fullScreenWarning)?.id
        const newsIds = response.vexlBotNews.map((item) => item.id)
        const idsFromResponse = [...(warningId ? [warningId] : []), ...newsIds]
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
    ignoreReportErrors('warn', 'Error loading news and annonuncements')
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

export const createIsVisibleIdAtom = (
  id: Uuid,
  temporary: boolean
): WritableAtom<boolean, [visible: boolean], void> =>
  atom(
    (get) => {
      const cancelledIds = get(cancelledIdsAtom)

      return !cancelledIds.includes(id)
    },
    (_, set, v) => {
      if (temporary) {
        if (v) {
          set(temporaryCancelledIdsAtom, (prev) => prev.filter((i) => i !== id))
          return
        }
        set(temporaryCancelledIdsAtom, (prev) => [...prev, id])
        return
      }

      // MMKV
      if (v) {
        set(cancelledIdsMmkv, (prev) => ({
          ids: prev.ids.filter((i) => i !== id),
        }))
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
