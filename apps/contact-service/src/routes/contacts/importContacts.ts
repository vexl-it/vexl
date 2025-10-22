import {HttpApiBuilder} from '@effect/platform/index'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {DashboardReportsService} from '@vexl-next/server-utils/src/DashboardReportsService'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, pipe} from 'effect'
import {ContactDbService} from '../../db/ContactDbService'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'
import {ImportContactsQuotaService} from './importContactsQuotaService'
import {notifyOthersAboutNewUserForked} from './utils/notifyOthersAboutNewUser'

export const importContacts = HttpApiBuilder.handler(
  ContactApiSpecification,
  'Contact',
  'importContacts',
  (req) =>
    CurrentSecurity.pipe(
      Effect.flatMap((security) =>
        Effect.gen(function* (_) {
          const contactDb = yield* _(ContactDbService)
          const importContactsQuotaService = yield* _(
            ImportContactsQuotaService
          )

          const contactsBefore = yield* _(
            contactDb.findContactsByHashFrom(security.hash),
            Effect.map(
              Array.map((contact) => ({
                hashFrom: contact.hashFrom,
                hashTo: contact.hashTo,
              }))
            )
          )

          const contactsReceived = pipe(
            req.payload.contacts,
            // Do not allow importing myself
            Array.filter((a) => a !== security.hash),
            // Do not allow importing duplicates
            Array.dedupe,
            Array.map((contact) => ({
              hashFrom: security.hash,
              hashTo: contact,
            }))
          )

          const newContacts = Array.differenceWith<{
            hashFrom: HashedPhoneNumber
            hashTo: HashedPhoneNumber
          }>((a, b) => a.hashFrom === b.hashFrom && a.hashTo === b.hashTo)(
            contactsReceived,
            contactsBefore
          )

          const contactsToInsert = req.payload.replace
            ? contactsReceived
            : newContacts

          if (req.payload.replace)
            yield* _(contactDb.deleteContactsByHashFrom(security.hash))

          yield* _(
            Effect.forEach(contactsToInsert, contactDb.insertContact, {
              batching: true,
            })
          )

          yield* _(Effect.log('New contacts. Notifying', newContacts))

          yield* _(
            importContactsQuotaService.checkAndIncrementImportContactsQuota(
              security.hash
            )(newContacts.length)
          )

          yield* _(
            DashboardReportsService,
            Effect.flatMap((service) => service.reportContactsImported())
          )

          return {
            toReturn: {
              imported: true as const,
              message: 'ok' as const,
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
              ownerHash: security.hash,
            })
          ),
          Effect.map(({toReturn}) => toReturn)
        )
      ),
      makeEndpointEffect
    )
)
