import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {GetClubContactsErrors} from '@vexl-next/rest-api/src/services/contact/contracts'
import {GetClubContactsEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'

export const getClubContacts = Handler.make(GetClubContactsEndpoint, (req, _) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.body))

      const clubsDb = yield* _(ClubsDbService)
      const clubMembersDb = yield* _(ClubMembersDbService)

      const club = yield* _(
        clubsDb.findClubByUuid({uuid: req.body.clubUuid}),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
          () => new NotFoundError({message: 'Club not found'})
        )
      )

      yield* _(
        clubMembersDb.findClubMemberByPublicKey({
          publicKey: req.body.publicKey,
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
        clubUuid: req.body.clubUuid,
        items: pubKeys,
      }
    }).pipe(
      Effect.withSpan('Fetch club contacts', {
        attributes: {clubId: req.body.clubUuid},
      })
    ),
    GetClubContactsErrors
  )
)
