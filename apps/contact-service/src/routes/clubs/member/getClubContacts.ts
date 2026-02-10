import {HttpApiBuilder} from '@effect/platform/index'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Effect} from 'effect'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'

export const getClubContacts = HttpApiBuilder.handler(
  ContactApiSpecification,
  'ClubsMember',
  'getClubContacts',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      const clubsDb = yield* _(ClubsDbService)
      const clubMembersDb = yield* _(ClubMembersDbService)

      const club = yield* _(
        clubsDb.findClubByUuid({uuid: req.payload.clubUuid}),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
          () => new NotFoundError({message: 'Club not found'})
        )
      )

      yield* _(
        clubMembersDb.findClubMemberByPublicKey({
          publicKey: req.payload.publicKey,
        }),
        Effect.flatten,
        Effect.filterOrFail(
          (member) => club.id === member.clubId,
          () => new NotFoundError({message: 'Club not found'})
        ),
        Effect.catchTag(
          'NoSuchElementException',
          () => new NotFoundError({message: 'Member not found'})
        )
      )

      const clubContacts = yield* _(
        clubMembersDb.queryAllClubMembers({id: club.id})
      )

      return {
        clubUuid: req.payload.clubUuid,
        // Legacy field for backward compatibility - only publicKey
        items: clubContacts.map((contact) => contact.publicKey),
        // V2 field with full contact info
        itemsV2: clubContacts.map((contact) => ({
          publicKey: contact.publicKey,
          publicKeyV2: contact.publicKeyV2,
        })),
      }
    }).pipe(
      Effect.withSpan('Fetch club contacts', {
        attributes: {clubId: req.payload.clubUuid},
      }),
      makeEndpointEffect
    )
)
