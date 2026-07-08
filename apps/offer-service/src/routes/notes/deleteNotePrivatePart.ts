import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {CanNotDeletePrivatePartOfAuthor} from '@vexl-next/rest-api/src/services/offer/contracts'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, Option, flow, pipe} from 'effect'
import {NoteDbService} from '../../db/NoteDbService'
import {hashNoteAdminId} from '../../utils/hashNoteIds'
import {withNoteAdminActionRedisLock} from '../../utils/withNoteRedisLock'

export const deleteNotePrivatePart = HttpApiBuilder.handler(
  OfferApiSpecification,
  'Notes',
  'deleteNotePrivatePart',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const noteDb = yield* _(NoteDbService)

      // The author's own private part carries the note's adminId. Deleting it
      // would strip the author of admin access, so it must never be removed.
      if (
        Array.contains(req.payload.publicKeys, security.publicKey) ||
        Array.contains(
          req.payload.publicKeys,
          Option.getOrElse(security.publicKeyV2, () => 'none')
        )
      ) {
        return yield* _(
          Effect.fail(
            new CanNotDeletePrivatePartOfAuthor({
              status: 400,
            })
          )
        )
      }

      const hashedAdminIds = yield* _(
        Effect.forEach(req.payload.adminIds, hashNoteAdminId)
      )

      const notes = yield* _(
        Effect.forEach(hashedAdminIds, noteDb.queryNotePublicPartByAdminId, {
          batching: true,
        }),
        Effect.map(
          flow(
            Array.filter(Option.isSome),
            Array.map((a) => a.value)
          )
        )
      )

      const combinationsToDelete = pipe(
        Array.map(notes, (note) =>
          Array.map(req.payload.publicKeys, (pubKey) => ({
            userPublicKey: pubKey,
            noteId: note.id,
          }))
        ),
        Array.flatten
      )

      yield* _(
        Effect.forEach(combinationsToDelete, noteDb.deleteNotePrivatePart, {
          batching: true,
        })
      )
      return {}
    }).pipe(
      withDbTransaction,
      withNoteAdminActionRedisLock([...req.payload.adminIds]),
      makeEndpointEffect
    )
)
