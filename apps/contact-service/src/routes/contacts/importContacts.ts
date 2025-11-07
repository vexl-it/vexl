import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {DashboardReportsService} from '@vexl-next/server-utils/src/DashboardReportsService'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, flow, pipe} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {
  hashForClient,
  type ServerHashedNumber,
  serverHashPhoneNumber,
} from '../../utils/serverHashContact'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'
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
          const contactDb = yield* _(ContactDbService)
          const importContactsQuotaService = yield* _(
            ImportContactsQuotaService
          )

          const userServerHash = security.userServerHash

          const contactsBefore = yield* _(
            contactDb.findContactsByHashFrom(userServerHash),
            Effect.map(
              Array.map((contact) => ({
                hashFrom: contact.hashFrom,
                hashTo: contact.hashTo,
              }))
            )
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

          yield* _(Effect.log('New contacts. Notifying', newContacts))

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
            newContacts: Array.map(newContacts, (o) => o.hashTo),
          }
        }).pipe(
          Effect.withSpan('Import contacts'),
          withDbTransaction,
          withUserActionRedisLock(security.hash),
          Effect.tap(({newContacts}) =>
            // Need to do this after the DB transaction is committed
            notifyOthersAboutNewUserForked({
              importedHashes: newContacts,
              ownerHash: security.userServerHash,
            })
          ),
          Effect.map(({toReturn}) => toReturn)
        )
      ),
      makeEndpointEffect
    )
)
