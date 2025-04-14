import {
  type PrivateKeyHolder,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {ClubInfo} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Array, Effect, Option, pipe, Record, Schema} from 'effect'
import {type Atom, atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {splitAtom} from 'jotai/utils'
import {apiAtom} from '../../../api'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'
import {getNotificationTokenE} from '../../../utils/notifications'
import reportError, {ignoreReportErrors} from '../../../utils/reportError'
import {myStoredClubsAtom} from './clubsStore'
import {processClubRemovedFromBeActionAtom} from './processClubRemovedFromBeActionAtom'

const ClubWithMembers = Schema.Struct({
  club: ClubInfo,
  members: Schema.Array(PublicKeyPemBase64E),
  isModerator: Schema.Boolean,
})
export type ClubWithMembers = typeof ClubWithMembers.Type

export class UserClubKeypairMissingError extends Schema.TaggedError<UserClubKeypairMissingError>(
  'UserClubKeypairMissingError'
)('UserClubKeypairMissingError', {
  status: Schema.optionalWith(Schema.Literal(404), {default: () => 404}),
  message: Schema.String,
}) {}

const clubsWithMembersStorageAtom = atomWithParsedMmkvStorageE(
  'clubsWithMembers',
  {data: []},
  Schema.Struct({data: Schema.Array(ClubWithMembers).pipe(Schema.mutable)})
)

export const clubsWithMembersAtom = atom(
  (get) => get(clubsWithMembersStorageAtom),
  (get, set) => {
    return Effect.gen(function* (_) {
      const api = get(apiAtom)
      const myStoredClubs = get(myStoredClubsAtom)

      const notificationToken = yield* _(
        getNotificationTokenE(),
        Effect.map(Option.fromNullable)
      )

      const fetchClubWithMembers = ({
        clubUuid,
        keyPair,
      }: {
        clubUuid: ClubUuid
        keyPair: PrivateKeyHolder
      }): Effect.Effect<
        | {clubUuid: ClubUuid; state: 'loaded'; data: ClubWithMembers}
        | {clubUuid: ClubUuid; state: 'removed'}
        | {clubUuid: ClubUuid; state: 'errorLoading'}
      > =>
        Effect.gen(function* (_) {
          const clubInfo = yield* _(
            api.contact.getClubInfo({keyPair, notificationToken}).pipe(
              Effect.catchTag('NotFoundError', () => {
                return Effect.fail({_tag: 'clubDoesNotExist'})
              })
            )
          )

          const clubMembers = yield* _(
            api.contact.getClubContacts({
              clubUuid: clubInfo.clubInfoForUser.club.uuid,
              keyPair,
            })
          )

          return {
            clubUuid: clubInfo.clubInfoForUser.club.uuid,
            state: 'loaded' as const,
            data: {
              club: clubInfo.clubInfoForUser.club,
              members: clubMembers.items,
              isModerator: clubInfo.clubInfoForUser.isModerator,
            },
          }
        }).pipe(
          Effect.catchTag('clubDoesNotExist', (e) => {
            return Effect.zipRight(
              set(processClubRemovedFromBeActionAtom, {
                clubUuid,
              }).pipe(
                ignoreReportErrors(
                  'warn',
                  'Error processing club after removed from BE'
                )
              ),
              Effect.succeed({clubUuid, state: 'removed' as const})
            )
          }),
          Effect.catchAll((e) =>
            Effect.sync(() => {
              if (
                e._tag !== 'NetworkError' &&
                e._tag !== 'CryptoError' &&
                e._tag !== 'InvalidChallengeError' &&
                e._tag !== 'ErrorSigningChallenge'
              ) {
                reportError(
                  'error',
                  new Error(
                    'Unknown error when getting camera access, check library'
                  ),
                  {e}
                )
              }

              return {
                clubUuid,
                state: 'errorLoading' as const,
              }
            })
          )
        )

      const clubs = yield* _(
        myStoredClubs,
        Record.toEntries,
        Array.map(([clubUuid, keyPair]) => ({clubUuid, keyPair})),
        Array.map(fetchClubWithMembers),
        Effect.all
      )

      console.log('Fetched clubs', JSON.stringify(clubs, null, 2))

      const removedClubsUuids = Array.filterMap(clubs, (state) =>
        Option.fromNullable(state.state === 'removed' ? state.clubUuid : null)
      )

      const newClubs = Array.filterMap(clubs, (state) =>
        Option.fromNullable(state.state === 'loaded' ? state.data : null)
      )

      set(clubsWithMembersStorageAtom, (prev) => ({
        ...prev,
        data: pipe(
          prev.data,
          Array.filter(
            (club) => !Array.contains(removedClubsUuids, club.club.uuid)
          ),
          (prevClubs) =>
            Array.unionWith(
              newClubs,
              prevClubs,
              (a, b) => a.club.uuid === b.club.uuid
            )
        ),
      }))
    })
  }
)

export const clubsWithMembersAtomsAtom = splitAtom(
  focusAtom(clubsWithMembersStorageAtom, (optic) => optic.prop('data'))
)

export const fetchedClubsAtom = atom((get) => {
  const clubs = get(clubsWithMembersAtom)
  return clubs.data
})

export const singleClubAtom = (
  clubUuid: ClubUuid
): Atom<Option.Option<ClubWithMembers>> =>
  atom((get) =>
    Array.findFirst(
      get(fetchedClubsAtom),
      (club) => club.club.uuid === clubUuid
    )
  )
