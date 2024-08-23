import {ImportListEmptyError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ImportContactsEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import {DashboardReportsService} from '@vexl-next/server-utils/src/DashboardReportsService'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, pipe} from 'effect'
import {Handler} from 'effect-http'
import {ContactDbService} from '../../db/ContactDbService'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'
import {notifyOthersAboutNewUserForked} from './utils/notifyOthersAboutNewUser'

export const importContacts = Handler.make(
  ImportContactsEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const contactDb = yield* _(ContactDbService)
        const contactsBefore = yield* _(
          contactDb.findContactsByHashFrom(security.hash)
        )

        yield* _(contactDb.deleteContactsByHashFrom(security.hash))

        const contactsToInsert = pipe(
          req.body.contacts,
          Array.filter((a) => a !== security.hash),
          Array.dedupe,
          Array.map((contact) => ({
            hashFrom: security.hash,
            hashTo: contact,
          }))
        )

        yield* _(
          Effect.forEach(contactsToInsert, contactDb.insertContact, {
            batching: true,
          })
        )

        const newContacts = Array.difference(contactsToInsert, contactsBefore)

        yield* _(Effect.log('New contacts', newContacts))

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
      ImportListEmptyError
    )
)
