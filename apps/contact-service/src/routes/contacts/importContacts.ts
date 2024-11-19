import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {ImportContactsErrors} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ImportContactsEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import {DashboardReportsService} from '@vexl-next/server-utils/src/DashboardReportsService'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, pipe} from 'effect'
import {Handler} from 'effect-http'
import {ContactDbService} from '../../db/ContactDbService'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'
import {ImportContactsQuotaService} from './importContactsQuotaService'
import {notifyOthersAboutNewUserForked} from './utils/notifyOthersAboutNewUser'

export const importContacts = Handler.make(
  ImportContactsEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const contactDb = yield* _(ContactDbService)
        const importContactsQuotaService = yield* _(ImportContactsQuotaService)

        const contactsBefore = yield* _(
          contactDb.findContactsByHashFrom(security.hash),
          Effect.map(
            Array.map((contact) => ({
              hashFrom: contact.hashFrom,
              hashTo: contact.hashTo,
            }))
          )
        )

        const contactsToInsert = pipe(
          req.body.contacts,
          Array.filter((a) => a !== security.hash),
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
          contactsToInsert,
          contactsBefore
        )

        yield* _(contactDb.deleteContactsByHashFrom(security.hash))

        yield* _(
          Effect.forEach(contactsToInsert, contactDb.insertContact, {
            batching: true,
          })
        )

        yield* _(Effect.log('New contacts', newContacts))

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
          imported: true,
          message: 'ok',
        }
      }).pipe(
        Effect.withSpan('Import contacts'),
        withDbTransaction,
        withUserActionRedisLock(security.hash),
        Effect.zipLeft(
          notifyOthersAboutNewUserForked({
            importedHashes: req.body.contacts,
            ownerHash: security.hash,
          })
        )
      ),
      ImportContactsErrors
    )
)
