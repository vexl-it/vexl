import {Schema} from '@effect/schema'
import {FetchMyContactsEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, pipe} from 'effect'
import {Handler} from 'effect-http'
import {ContactDbService} from '../../db/ContactDbService'

export const fetchMyContacts = Handler.make(
  FetchMyContactsEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const contactDb = yield* _(ContactDbService)

        const firstLevelContacts =
          req.query.level === 'ALL' || req.query.level === 'FIRST'
            ? yield* _(
                contactDb.findFirstLevelContactsPublicKeysByHashFrom(
                  security.hash
                ),
                Effect.withSpan('Fetch first level contacts')
              )
            : []

        const secondLevelContacts =
          req.query.level === 'ALL' || req.query.level === 'SECOND'
            ? yield* _(
                contactDb.findSecondLevelContactsPublicKeysByHashFrom(
                  security.hash
                ),
                Effect.withSpan('Fetch second level contacts')
              )
            : []

        const combined = yield* _(
          Effect.sync(() =>
            pipe(
              Array.dedupe([...firstLevelContacts, ...secondLevelContacts]),
              Array.map((publicKey) => ({publicKey}))
            )
          ),
          Effect.withSpan('Deduplicating public keys')
        )

        return {
          items: combined,
          currentPage: 0,
          currentPageSize: combined.length,
          pagesTotal: 1,
          itemsCount: combined.length,
          itemsCountTotal: combined.length,
          nextLink: null,
          prevLink: null,
        }
      }).pipe(
        Effect.withSpan('Fetch my contacts', {
          attributes: {level: req.query.level},
        })
      ),
      Schema.Void
    )
)
