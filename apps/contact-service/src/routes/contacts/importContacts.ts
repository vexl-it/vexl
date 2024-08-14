import {ImportListEmptyError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ImportContactsEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, pipe} from 'effect'
import {Handler} from 'effect-http'
import {ContactDbService} from '../../db/ContactDbService'
import {withUserActionRedisLock} from '../../utils/withUserActionRedisLock'

export const importContacts = Handler.make(
  ImportContactsEndpoint,
  (req, security) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        if (!Array.isNonEmptyReadonlyArray(req.body.contacts)) {
          return yield* _(Effect.fail(new ImportListEmptyError()))
        }

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
        // TODO - send push notification to new contacts
        yield* _(Effect.log('New contacts', newContacts))

        return {
          imported: true,
          message: 'ok',
        }
      }).pipe(
        Effect.withSpan('Import contacts'),
        withDbTransaction,
        withUserActionRedisLock(security.hash)
      ),
      ImportListEmptyError
    )
)
