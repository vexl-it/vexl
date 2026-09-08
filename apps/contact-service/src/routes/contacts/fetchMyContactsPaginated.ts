import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import createPaginatedResponse from '@vexl-next/server-utils/src/createPaginatedResponse'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {
  contactActiveWindowDaysConfig,
  contactPublicImportCountThresholdConfig,
} from '../../configs'
import {ContactDbService} from '../../db/ContactDbService'
import {type FindFirstLevelContactsPublicKeysByHashFromPaginatedResult} from '../../db/ContactDbService/queries/createFindFirstLevelContactsPublicKeysByHashFromPaginated'
import {UserDbService} from '../../db/UserDbService'
import {serverHashPhoneNumber} from '../../utils/serverHashContact'
import {toCompatiblePublicKeyArray} from '../../utils/toCompatiblePublicKeyArray'

const DEFAULT_LAST_USER_ID = 0

export const FetchMyContactsNextPageToken = Schema.Struct({
  userId: Schema.Int,
})
type FetchMyContactsNextPageToken = typeof FetchMyContactsNextPageToken.Type

// TODO create V2
export const fetchMyContactsPaginated = makeHttpApiHandler(
  ContactApiSpecification,
  'Contact',
  'fetchMyContactsPaginated',
  (req) =>
    Effect.gen(function* () {
      const security = yield* pipe(
        CurrentSecurity,
        Effect.bind('serverHash', (s) => serverHashPhoneNumber(s.hash))
      )
      const contactDb = yield* ContactDbService
      const contactActiveWindowDays = yield* contactActiveWindowDaysConfig
      const publicImportCountThreshold =
        yield* contactPublicImportCountThresholdConfig

      yield* pipe(
        UserDbService,
        Effect.flatMap((userDb) =>
          userDb.updateAppSourceForUser({
            appSource: req.headers.appSourceOrNone,
            publicKey: security.publicKey,
            hash: security.serverHash,
          })
        )
      )

      const toReturn = yield* pipe(
        createPaginatedResponse({
          nextPageTokenSchema: FetchMyContactsNextPageToken,
          nextPageToken: req.query.nextPageToken,
          defaultNextPageToken: {
            userId: DEFAULT_LAST_USER_ID,
          },
          limit: req.query.limit,
          createNextPageToken: (
            lastItem: FindFirstLevelContactsPublicKeysByHashFromPaginatedResult
          ) => ({
            userId: lastItem.userId,
          }),
          dbEffectToRun: ({limit, decodedNextPageToken}) =>
            req.query.level === 'FIRST'
              ? contactDb.findFirstLevelContactsPublicKeysByHashFromPaginated({
                  hashFrom: security.serverHash,
                  limit,
                  userId: decodedNextPageToken?.userId,
                  activeWithinDays: contactActiveWindowDays,
                })
              : contactDb.findSecondLevelContactsPublicKeysByHashFromPaginated({
                  hashFrom: security.serverHash,
                  limit,
                  userId: decodedNextPageToken?.userId,
                  activeWithinDays: contactActiveWindowDays,
                  publicImportCountThreshold,
                }),
        }),
        Effect.withSpan('Fetch first level contacts')
      )

      const contactsWithoutOwner = pipe(
        toReturn.items,
        // Do not return the owner as a contact
        Array.filter(
          (contact) =>
            contact.publicKey !== security.publicKey &&
            Option.getOrElse(contact.publicKeyV2, () => 'no-key-contact') !==
              Option.getOrElse(security.publicKeyV2, () => 'no-key-security')
        )
      )

      const contactsWithCompatiblePublicKeys =
        yield* toCompatiblePublicKeyArray(req.headers.clientVersionOrNone)(
          contactsWithoutOwner
        )

      return {
        ...toReturn,
        items: contactsWithCompatiblePublicKeys,
      }
    }).pipe(
      Effect.withSpan('Fetch my contacts paginated', {
        attributes: {level: req.query.level},
      }),
      makeEndpointEffect
    )
)
