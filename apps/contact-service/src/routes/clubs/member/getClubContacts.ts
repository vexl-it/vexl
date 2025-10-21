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

      const pubKeys = clubContacts.map((contact) => contact.publicKey)

      return {
        clubUuid: req.payload.clubUuid,
        items: pubKeys,
      }
    }).pipe(
      Effect.withSpan('Fetch club contacts', {
        attributes: {clubId: req.payload.clubUuid},
      }),
      makeEndpointEffect
    )
)
