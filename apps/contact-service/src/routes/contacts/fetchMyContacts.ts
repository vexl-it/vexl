import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, pipe} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'

export const fetchMyContacts = HttpApiBuilder.handler(
  ContactApiSpecification,
  'Contact',
  'fetchMyContacts',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const contactDb = yield* _(ContactDbService)
      const userServerHash = yield* _(serverHashPhoneNumber(security.hash))

      yield* _(
        UserDbService,
        Effect.flatMap((userDb) =>
          userDb.updateAppSourceForUser({
            appSource: req.headers.appSourceOrNone,
            publicKey: security.publicKey,
            hash: userServerHash,
          })
        )
      )

      const firstLevelContacts =
        req.urlParams.level === 'ALL' || req.urlParams.level === 'FIRST'
          ? yield* _(
              contactDb.findFirstLevelContactsPublicKeysByHashFrom(
                userServerHash
              ),
              Effect.withSpan('Fetch first level contacts')
            )
          : []

      const secondLevelContacts =
        req.urlParams.level === 'ALL' || req.urlParams.level === 'SECOND'
          ? yield* _(
              contactDb.findSecondLevelContactsPublicKeysByHashFrom(
                userServerHash
              ),
              Effect.withSpan('Fetch second level contacts')
            )
          : []

      const combined = yield* _(
        Effect.sync(() =>
          pipe(
            [...firstLevelContacts, ...secondLevelContacts],
            // Dedupe by publicKey while keeping the full contact structure
            Array.dedupeWith(
              (a, b) =>
                a.publicKey === b.publicKey && a.publicKeyV2 === b.publicKeyV2
            ),
            // HOTFIX - remove owner public key from the list of returned contacts
            Array.filter((contact) => contact.publicKey !== security.publicKey)
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
        attributes: {level: req.urlParams.level},
      }),
      makeEndpointEffect
    )
)
