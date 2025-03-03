import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {FetchClubContactsEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {ClubMembersDbService} from '../../db/ClubMemberDbService'
import {ClubsDbService} from '../../db/ClubsDbService'

export const fetchClubContacts = Handler.make(
  FetchClubContactsEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const clubsDb = yield* _(ClubsDbService)
        const clubMembersDb = yield* _(ClubMembersDbService)

        const club = yield* _(
          clubsDb.findClubByUuid({uuid: req.query.clubUuid}),
          Effect.flatten,
          Effect.catchTag('NoSuchElementException', (e) => new NotFoundError())
        )

        const clubContacts = yield* _(
          clubMembersDb.queryAllClubMembers({id: club.id})
        )

        const pubKeys = clubContacts.map((contact) => contact.publicKey)

        return {
          clubUuid: req.query.clubUuid,
          items: pubKeys,
        }
      }).pipe(
        Effect.withSpan('Fetch club contacts', {
          attributes: {clubId: req.query.clubUuid},
        })
      ),
      NotFoundError
    )
)
