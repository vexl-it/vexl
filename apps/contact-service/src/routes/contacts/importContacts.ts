import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {DashboardReportsService} from '@vexl-next/server-utils/src/DashboardReportsService'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
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

export const importContacts = makeHttpApiHandler(
  ContactApiSpecification,
  'Contact',
  'importContacts',
  (req) =>
    CurrentSecurity.pipe(
      Effect.bind('userServerHash', (s) => serverHashPhoneNumber(s.hash)),
      Effect.flatMap((security) =>
        Effect.gen(function* () {
          const contactDb = yield* ContactDbService
          const importContactsQuotaService = yield* ImportContactsQuotaService

          const userServerHash = security.userServerHash

          const contactsBefore = yield* pipe(
            contactDb.findContactsByHashFrom(userServerHash),
            Effect.map(
              Array.map((contact) => ({
                hashFrom: contact.hashFrom,
                hashTo: contact.hashTo,
              }))
            )
          )

          const contactsReceived = yield* pipe(
            req.payload.contacts,
            Array.filter((a) => a !== security.hash),
            Array.dedupe,
            Array.map(
              flow(
                serverHashPhoneNumber,
                Effect.map((contact) => ({
                  hashFrom: userServerHash,
                  hashTo: contact,
                }))
              )
            ),
            (effects) => Effect.all(effects, {concurrency: 'unbounded'})
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
            yield* contactDb.deleteContactsByHashFrom(userServerHash)

          yield* Effect.forEach(contactsToInsert, contactDb.insertContact, {})

          yield* Effect.log('New contacts. Notifying', newContacts)

          yield* importContactsQuotaService.checkAndIncrementImportContactsQuota(
            userServerHash
          )(newContacts.length)

          yield* pipe(
            DashboardReportsService,
            Effect.flatMap((service) => service.reportContactsImported())
          )

          const phoneNumberHashesToServerToClientHash = yield* pipe(
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
            (effects) => Effect.all(effects, {concurrency: 'unbounded'})
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
