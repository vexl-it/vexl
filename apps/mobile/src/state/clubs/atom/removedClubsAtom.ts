import {ClubInfo, type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {ClubDeactivatedNotificationData} from '@vexl-next/domain/src/general/notifications'
import {
  UnixMillisecondsE,
  unixMillisecondsFromNow,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Option, Schema} from 'effect'
import {atom, useSetAtom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {useEffect} from 'react'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'
import {type FocusAtomType} from '../../../utils/atomUtils/FocusAtomType'
import {ClubStats} from '../domain'

const COMPLETELY_REMOVE_CLUB_AFTER_DAYS = 30

const RemovedClubInfo = Schema.Struct({
  clubInfo: ClubInfo,
  removedAt: UnixMillisecondsE,
  notified: Schema.Boolean,
  reason: Schema.optionalWith(ClubDeactivatedNotificationData.fields.reason, {
    as: 'Option',
  }),
  stats: ClubStats,
  hiddenForVexlbot: Schema.Boolean,
})
export type RemovedClubInfo = typeof RemovedClubInfo.Type

const removedClubsStorageAtom = atomWithParsedMmkvStorageE(
  'removedClubs',
  {data: []},
  Schema.Struct({
    data: Schema.Array(RemovedClubInfo)
      // To work with optics
      .pipe(Schema.mutable),
  })
)

export const removedClubsAtom = focusAtom(removedClubsStorageAtom, (optic) =>
  optic.prop('data')
)

export const createSingleRemovedClubAtom = (
  clubUuid: ClubUuid
): FocusAtomType<RemovedClubInfo | undefined> =>
  focusAtom(removedClubsAtom, (optic) =>
    optic.find((club) => club.clubInfo.uuid === clubUuid)
  )

export const markRemovedClubAsNotifiedActionAtom = atom(
  null,
  (get, set, {clubUuid}: {clubUuid: ClubUuid}) => {
    set(
      removedClubsAtom,
      Array.map((club) => {
        if (club.clubInfo.uuid === clubUuid) {
          return {
            ...club,
            notified: true,
          }
        }
        return club
      })
    )
  }
)

export const addReasonToRemovedClubActionAtom = atom(
  null,
  (
    get,
    set,
    {
      clubUuid,
      reason,
    }: {
      clubUuid: ClubUuid
      reason: Option.Option.Value<RemovedClubInfo['reason']>
    }
  ) => {
    set(
      removedClubsAtom,
      Array.map((club) => {
        if (club.clubInfo.uuid === clubUuid) {
          return {
            ...club,
            reason: Option.some(reason),
          }
        }
        return club
      })
    )
  }
)

export const cleanupRemovedClubsActionAtom = atom(null, (_, set) => {
  set(
    removedClubsAtom,
    Array.filter(
      (one) =>
        one.removedAt >
        unixMillisecondsFromNow(
          COMPLETELY_REMOVE_CLUB_AFTER_DAYS * 24 * 60 * 60 * 1000
        )
    )
  )
})

export function useCleanupRemovedClubsOnMount(): void {
  const cleanupRemovedClubs = useSetAtom(cleanupRemovedClubsActionAtom)
  useEffect(() => {
    cleanupRemovedClubs()
  }, [cleanupRemovedClubs])
}

export const addClubToRemovedClubsActionAtom = atom(
  null,
  (get, set, {clubInfo, stats}: {clubInfo: ClubInfo; stats: ClubStats}) => {
    set(removedClubsAtom, (prev) => [
      ...prev,
      {
        clubInfo,
        notified: false,
        reason: Option.none(),
        removedAt: unixMillisecondsNow(),
        stats,
        hiddenForVexlbot: false,
      },
    ])
  }
)

export const markRemovedClubAsHiddenForVexlbotActionAtom = atom(
  null,
  (get, set, clubUuid: ClubUuid) => {
    set(
      removedClubsAtom,
      Array.map((club) => {
        if (club.clubInfo.uuid === clubUuid) {
          return {
            ...club,
            hiddenForVexlbot: true,
          }
        }
        return club
      })
    )
  }
)
