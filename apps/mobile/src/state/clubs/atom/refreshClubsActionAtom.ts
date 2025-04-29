import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {Array, Effect, Either, Option, pipe, Record} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {getNotificationTokenE} from '../../../utils/notifications'
import {ignoreReportErrors} from '../../../utils/reportError'
import {fetchClubWithMembersReportApiErrors} from '../utils'
import {
  clubsToKeyHolderAtom,
  removeClubFromKeyHolderStateActionAtom,
} from './clubsToKeyHolderAtom'
import {
  clubsWithMembersStorageAtom,
  removeClubWithMembersFromStateActionAtom,
} from './clubsWithMembersAtom'
import {updateOffersWhenUserIsNoLongerInClubActionAtom} from './updateOffersWhenUserIsNoLongerInClubActionAtom'

const fetchClubWithMembersHandleStateIfNotFoundActionAtom = atom(
  null,
  (
    get,
    set,
    {
      clubUuid,
      keyPair,
    }: {
      clubUuid: ClubUuid
      keyPair: PrivateKeyHolder
    }
  ) =>
    Effect.gen(function* (_) {
      const notificationToken = yield* _(
        getNotificationTokenE(),
        Effect.map(Option.fromNullable)
      )
      const api = get(apiAtom)

      return yield* _(
        fetchClubWithMembersReportApiErrors({
          contactApi: api.contact,
          keyPair,
          notificationToken,
        }).pipe(
          Effect.tapErrorTag('ClubNotFoundError', (e) => {
            return set(updateOffersWhenUserIsNoLongerInClubActionAtom, {
              clubUuid,
            }).pipe(
              ignoreReportErrors(
                'warn',
                'Error processing club after removed from BE'
              ),
              Effect.andThen(() => {
                set(removeClubFromKeyHolderStateActionAtom, clubUuid)
                set(removeClubWithMembersFromStateActionAtom, clubUuid)
              })
            )
          }),
          Effect.mapError((e) => ({clubUuid, ...e}))
        )
      )
    })
)

export const syncSingleClubHandleStateWhenNotFoundActionAtom = atom(
  null,
  (get, set, {clubUuid}: {clubUuid: ClubUuid}) =>
    Effect.gen(function* (_) {
      const keyPair = yield* _(Record.get(get(clubsToKeyHolderAtom), clubUuid))

      const clubE = yield* _(
        set(fetchClubWithMembersHandleStateIfNotFoundActionAtom, {
          clubUuid,
          keyPair,
        }),
        Effect.either
      )

      if (Either.isLeft(clubE)) {
        return yield* _(Effect.fail(clubE.left))
      }

      set(clubsWithMembersStorageAtom, (prev) => ({
        ...prev,
        data: pipe(
          // Make sure to handle when club is new
          prev.data,
          Array.map((o) => [o.club.uuid, o] as const),
          Record.fromEntries,
          Record.set(clubUuid, clubE.right),
          Record.values
        ),
      }))

      return clubE.right
    })
)

export const syncAllClubsHandleStateWhenNotFoundActionAtom = atom(
  null,
  (
    get,
    set,
    {
      updateOnlyUuids,
    }: {updateOnlyUuids?: readonly [ClubUuid, ...ClubUuid[]]} = {}
  ) =>
    Effect.gen(function* (_) {
      console.info('🦋 Refreshing clubs connections state')
      const clubsToKeyHolder = get(clubsToKeyHolderAtom)

      const fetchedClubs = yield* _(
        clubsToKeyHolder,
        Record.toEntries,
        Array.map(([clubUuid, keyPair]) => {
          return Effect.gen(function* (_) {
            // If we are updating only specific clubs, skip the one that is not in the list
            if (updateOnlyUuids && !Array.contains(updateOnlyUuids, clubUuid))
              return yield* _(
                Effect.fail({
                  _tag: 'ClubNotFetchedAsInstructed' as const,
                  clubUuid,
                })
              )

            return yield* _(
              set(fetchClubWithMembersHandleStateIfNotFoundActionAtom, {
                clubUuid,
                keyPair,
              })
            )
          }).pipe(Effect.either)
        }),
        Effect.all
      )

      set(clubsWithMembersStorageAtom, (prev) => ({
        ...prev,
        data: pipe(
          fetchedClubs,
          Array.filterMap((fetchedClubE) => {
            return Either.match(fetchedClubE, {
              onLeft: (e) => {
                // Remove the club from the key holder state if it was not found
                if (e._tag === 'ClubNotFoundError') return Option.none()

                return Array.findFirst(
                  prev.data,
                  (oldClub) => oldClub.club.uuid === e.clubUuid
                )
              },
              onRight: Option.some,
            })
          })
        ),
      }))

      return fetchedClubs
    })
)
