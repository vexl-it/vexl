import {HttpApiBuilder} from '@effect/platform/index'
import {type ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {DashboardReportsService} from '@vexl-next/server-utils/src/DashboardReportsService'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, flow, pipe} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {UserDbService} from '../../db/UserDbService'
import {
  hashForClient,
  serverHashPhoneNumber,
} from '../../utils/serverHashContact'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'
import {findUserOrFail} from '../user/utils/refreshUserRecord'
import {ImportContactsQuotaService} from './importContactsQuotaService'
import {notifyOthersAboutNewUserForked} from './utils/notifyOthersAboutNewUser'

export const importContacts = HttpApiBuilder.handler(
  ContactApiSpecification,
  'Contact',
  'importContacts',
  (req) =>
    CurrentSecurity.pipe(
      Effect.bind('userServerHash', (s) => serverHashPhoneNumber(s.hash)),
      Effect.flatMap((security) =>
        Effect.gen(function* (_) {
          const userDb = yield* _(UserDbService)
          const contactDb = yield* _(ContactDbService)
          const importContactsQuotaService = yield* _(
            ImportContactsQuotaService
          )

          const userServerHash = security.userServerHash
          yield* _(userDb.lockAccountByPublicKey(security.publicKey))
          yield* _(
            findUserOrFail({
              publicKey: security.publicKey,
              serverHash: userServerHash,
              publicKeyV2: security.publicKeyV2,
            })
          )

          const accountContactsBefore = yield* _(
            contactDb.findContactsOfAccountByPublicKey(security.publicKey)
          )
          const contactsBefore = Array.filter(
            accountContactsBefore,
            (contact) => contact.hashFrom === userServerHash
          )

          const contactsReceived = yield* _(
            req.payload.contacts,
            // Do not allow importing myself
            Array.filter((a) => a !== security.hash),
            // Do not allow importing duplicates
            Array.dedupe,
            // convert to server-hashed contacts
            Array.map(
              flow(
                serverHashPhoneNumber,
                Effect.map((contact) => ({
                  hashFrom: userServerHash,
                  hashTo: contact,
                }))
              )
            ),
            Effect.allWith({concurrency: 'unbounded'})
          )

          const newContacts = Array.differenceWith<{
            hashFrom: ServerHashedNumber
            hashTo: ServerHashedNumber
          }>((a, b) => a.hashFrom === b.hashFrom && a.hashTo === b.hashTo)(
            contactsReceived,
            contactsBefore
          )

          const contactsToInsert = req.payload.replace
            ? contactsReceived
            : newContacts

          if (req.payload.replace)
            yield* _(contactDb.deleteContactsByHashFrom(userServerHash))

          yield* _(
            Effect.forEach(contactsToInsert, contactDb.insertContact, {
              batching: true,
            })
          )

          const hashesKnownToAccount = new Set(
            Array.map(accountContactsBefore, (contact) => contact.hashTo)
          )
          const hashesNewToAccount = pipe(
            contactsReceived,
            Array.map((contact) => contact.hashTo),
            Array.filter((hash) => !hashesKnownToAccount.has(hash))
          )

          yield* _(
            Effect.log('New contacts. Notifying', {
              count: newContacts.length,
              newToAccountCount: hashesNewToAccount.length,
            })
          )

          yield* _(
            importContactsQuotaService.checkAndIncrementImportContactsQuota(
              userServerHash
            )(newContacts.length)
          )

          yield* _(
            DashboardReportsService,
            Effect.flatMap((service) => service.reportContactsImported())
          )

          const phoneNumberHashesToServerToClientHash = yield* _(
            req.payload.contacts,
            Array.map((hashedNumber) =>
              pipe(
                serverHashPhoneNumber(hashedNumber),
                Effect.flatMap(hashForClient),
                Effect.map((serverToClientHash) => ({
                  hashedNumber,
                  serverToClientHash,
                }))
              )
            ),
            Effect.allWith({concurrency: 'unbounded'})
          )

          return {
            toReturn: {
              imported: true as const,
              message: 'ok' as const,
              phoneNumberHashesToServerToClientHash,
            },
            notifyParams: {
              // Friends who saved this number need to learn about it even
              // when another number of the account already holds them
              firstLevelHashes: Array.map(newContacts, (o) => o.hashTo),
              secondLevelHashes: hashesNewToAccount,
              ownerHash: userServerHash,
            },
          }
        }).pipe(
          Effect.withSpan('Import contacts'),
          withDbTransaction,
          withUserActionRedisLock(security.hash),
          Effect.tap(({notifyParams}) =>
            // Need to do this after the DB transaction is committed
            notifyOthersAboutNewUserForked(notifyParams)
          ),
          Effect.map(({toReturn}) => toReturn)
        )
      ),
      makeEndpointEffect
    )
)
