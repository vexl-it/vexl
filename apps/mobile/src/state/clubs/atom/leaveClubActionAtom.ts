import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {Array, Effect, Option, pipe, Schema, Struct} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import offerToConnectionsAtom from '../../connections/atom/offerToConnectionsAtom'
import {myOffersAtom} from '../../marketplace/atoms/myOffers'
import {myStoredClubsAtom} from './clubsStore'
import {clubsWithMembersAtom, singleClubAtom} from './clubsWithMembersAtom'

export class ClubNotFoundInInnerStateError extends Schema.TaggedError<ClubNotFoundInInnerStateError>(
  'ClubNotFoundInInnerStateError'
)('ClubNotFoundInInnerStateError', {
  cause: Schema.Unknown,
}) {}

export class ClubKeyNotFoundInInnerStateError extends Schema.TaggedError<ClubKeyNotFoundInInnerStateError>(
  'ClubKeyNotFoundInInnerStateError'
)('ClubKeyNotFoundInInnerStateError', {
  cause: Schema.Unknown,
}) {}

export const leaveClubActionAtom = atom(
  null,
  (get, set, clubUuid: ClubUuid) => {
    return Effect.gen(function* (_) {
      const {contact, offer} = get(apiAtom)

      const clubUuidKeyPair = yield* _(
        Option.fromNullable(get(myStoredClubsAtom)[clubUuid]),
        Effect.mapError((e) => new ClubKeyNotFoundInInnerStateError({cause: e}))
      )
      const club = yield* _(
        get(singleClubAtom(clubUuid)),
        Effect.mapError((e) => new ClubNotFoundInInnerStateError({cause: e}))
      )

      const clubOffersAdminIds = pipe(
        get(myOffersAtom),
        // TODO this will change
        Array.filter((offer) =>
          Array.contains(offer.offerInfo.publicPart.clubsUuids ?? [], clubUuid)
        ),
        Array.map((offer) => offer.ownershipInfo.adminId)
      )

      const clubMembersNonEmptyArray = pipe(
        club.members,
        Option.filter(Array.isNonEmptyArray)
      )

      if (Option.isSome(clubMembersNonEmptyArray)) {
        yield* _(
          offer.deletePrivatePart({
            body: {
              adminIds: clubOffersAdminIds,
              publicKeys: clubMembersNonEmptyArray.value,
            },
          })
        )
        // Remove clubs publicKeys from offerToConnections
        set(offerToConnectionsAtom, (prev) => ({
          ...prev,
          offerToConnections: Array.map(
            prev.offerToConnections,
            (oneOfferToConnection) => {
              if (
                !oneOfferToConnection.connections.clubs ||
                !Array.contains(
                  clubOffersAdminIds,
                  oneOfferToConnection.adminId
                )
              )
                return oneOfferToConnection

              const newClubs = Array.difference(
                oneOfferToConnection.connections.clubs,
                clubMembersNonEmptyArray.value
              )

              return {
                ...oneOfferToConnection,
                connections: {
                  ...oneOfferToConnection.connections,
                  clubs: newClubs,
                },
              }
            }
          ),
        }))
      }

      yield* _(
        contact.leaveClub({clubUuid, keyPair: clubUuidKeyPair}),
        Effect.andThen(() => {
          set(myStoredClubsAtom, Struct.omit(clubUuid))

          return set(clubsWithMembersAtom) // refresh clubs
        })
      )
    })
  }
)
