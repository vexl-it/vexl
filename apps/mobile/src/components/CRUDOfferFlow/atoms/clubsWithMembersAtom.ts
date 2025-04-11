import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
  PublicKeyPemBase64E,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type MyOfferInState} from '@vexl-next/domain/src/general/offers'
import {ClubInfo} from '@vexl-next/rest-api/src/services/contact/contracts'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {Array, Effect, Option, pipe, Record, Schema} from 'effect'
import {type ReadonlyNonEmptyArray} from 'fp-ts/lib/ReadonlyNonEmptyArray'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {splitAtom} from 'jotai/utils'
import {apiAtom} from '../../../api'
import {deleteClubForAllConnectionsActionAtom} from '../../../state/connections/atom/offerToConnectionsAtom'
import {
  myStoredClubsAtom,
  removeMyStoredClubFromStateActionAtom,
} from '../../../state/contacts/atom/clubsStore'
import {
  myOffersAtom,
  updateMyOfferPrivatePayloadActionAtom,
} from '../../../state/marketplace/atoms/myOffers'
import {updateOrFilterOffersFromDeletedClubsActionAtom} from '../../../state/marketplace/atoms/offersState'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'
import {getNotificationTokenE} from '../../../utils/notifications'
import reportError, {ignoreReportErrors} from '../../../utils/reportError'

const ClubWithMembers = Schema.Struct({
  club: ClubInfo,
  members: Schema.Array(PublicKeyPemBase64E),
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

const deletePrivatePartsForOffers = (
  connectionsWithOffers: Array<{
    connections: ReadonlyNonEmptyArray<PublicKeyPemBase64>
    offer: MyOfferInState
  }>,
  offerApi: OfferApi
): ReturnType<OfferApi['deletePrivatePart']> => {
  const adminIdsCombined = pipe(
    connectionsWithOffers,
    Array.map(({offer}) => offer.ownershipInfo.adminId)
  )
  const connectionsCombined = pipe(
    connectionsWithOffers,
    Array.map(({connections}) => connections),
    Array.flatten
  )
  return offerApi.deletePrivatePart({
    body: {
      adminIds: adminIdsCombined,
      publicKeys: connectionsCombined,
    },
  })
}

const processClubRemovedFromBeActionAtom = atom(
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
  ) => {
    return Effect.gen(function* (_) {
      const offerApi = get(apiAtom).offer
      const offerConnectionsToDeleteFromServer = set(
        deleteClubForAllConnectionsActionAtom,
        clubUuid
      )

      const myOffersWithConnectionsForClub = pipe(
        get(myOffersAtom),
        Array.map(Option.some),
        Array.filterMap(
          Option.filter((oneOffer) =>
            Array.contains(oneOffer.ownershipInfo.intendedClubs ?? [], clubUuid)
          )
        ),
        Array.filterMap((oneOfferForClub) =>
          Array.findFirst(
            offerConnectionsToDeleteFromServer,
            (oneConnectionRecord) =>
              oneConnectionRecord.adminId ===
              oneOfferForClub.ownershipInfo.adminId
          ).pipe(
            Option.map(({connections}) => ({
              connections,
              offer: oneOfferForClub,
            }))
          )
        )
      )

      yield* _(
        deletePrivatePartsForOffers(myOffersWithConnectionsForClub, offerApi),
        ignoreReportErrors(
          'warn',
          'Unable to delete private parts for deleted club'
        )
      )

      yield* _(
        myOffersWithConnectionsForClub,
        Array.map(({offer}) =>
          set(updateMyOfferPrivatePayloadActionAtom, {
            adminId: offer.ownershipInfo.adminId,
            intendedConnectionLevel:
              offer.ownershipInfo.intendedConnectionLevel,
            intendedClubs: offer.ownershipInfo.intendedClubs
              ? Array.filter(
                  offer.ownershipInfo.intendedClubs,
                  (one) => one !== clubUuid
                )
              : [],
          })
        ),
        Array.map(
          ignoreReportErrors(
            'warn',
            'Unable to update owners private parts for deleted club'
          )
        ),
        Effect.all
      )
      set(removeMyStoredClubFromStateActionAtom, clubUuid)
      set(updateOrFilterOffersFromDeletedClubsActionAtom, clubUuid)
    })
  }
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
            },
          }
        }).pipe(
          Effect.catchTag('clubDoesNotExist', (e) => {
            return Effect.zipRight(
              set(processClubRemovedFromBeActionAtom, {
                clubUuid,
                keyPair,
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

              // TODO: let user know somehow?

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
