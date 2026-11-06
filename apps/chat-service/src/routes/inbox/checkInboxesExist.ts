import {HttpApiBuilder} from '@effect/platform/index'
import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, HashSet, pipe} from 'effect'
import {InboxDbService} from '../../db/InboxDbService'
import {hashPublicKey} from '../../db/domain'

export const checkInboxesExist = HttpApiBuilder.handler(
  ChatApiSpecification,
  'Inboxes',
  'checkInboxesExist',
  (req) =>
    Effect.gen(function* (_) {
      const publicKeys = Array.dedupe(req.payload.publicKeys)
      if (!Array.isNonEmptyReadonlyArray(publicKeys))
        return {existingPublicKeys: []}

      const hashedPublicKeys = yield* _(
        Effect.forEach(publicKeys, (publicKey) =>
          Effect.map(hashPublicKey(publicKey), (hash) => ({hash, publicKey}))
        )
      )

      const inboxDb = yield* _(InboxDbService)
      const existingHashes = HashSet.fromIterable(
        yield* _(
          inboxDb.findExistingInboxPublicKeys(
            Array.map(hashedPublicKeys, (one) => one.hash)
          )
        )
      )

      return {
        existingPublicKeys: pipe(
          hashedPublicKeys,
          Array.filter((one) => HashSet.has(existingHashes, one.hash)),
          Array.map((one) => one.publicKey)
        ),
      }
    }).pipe(makeEndpointEffect)
)
