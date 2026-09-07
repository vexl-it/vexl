import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {DuplicatedPublicKeyError} from '@vexl-next/rest-api/src/services/offer/contracts'
import {type ServerNotePrivatePart} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, Option} from 'effect'
import {NoteDbService} from '../../db/NoteDbService'
import {hashNoteAdminId} from '../../utils/hashNoteIds'
import {withNoteAdminActionRedisLock} from '../../utils/withNoteRedisLock'

const isWithoutDuplicates = (
  privateList: readonly ServerNotePrivatePart[]
): boolean => {
  const deduped = Array.dedupeWith<readonly ServerNotePrivatePart[]>(
    (a, b) => a.userPublicKey === b.userPublicKey
  )(privateList)

  return Array.length(deduped) === Array.length(privateList)
}

export const createNotePrivatePart = makeHttpApiHandler(
  OfferApiSpecification,
  'Notes',
  'createNotePrivatePart',
  (req) =>
    Effect.gen(function* () {
      const noteDb = yield* NoteDbService

      if (!isWithoutDuplicates(req.payload.notePrivateList)) {
        return yield* Effect.fail(new DuplicatedPublicKeyError({status: 400}))
      }

      const hashedAdminId = yield* hashNoteAdminId(req.payload.adminId)

      const note = yield* noteDb.queryNotePublicPartByAdminId(hashedAdminId)
      if (Option.isNone(note)) {
        return yield* Effect.fail(new NotFoundError())
      }

      // Duplicates against already existing rows are allowed by design
      // (spec §4.6), so unlike offers we do not delete matching rows first.
      yield* Effect.forEach(
        req.payload.notePrivateList,
        (privatePart) =>
          noteDb.insertNotePrivatePart({
            ...privatePart,
            noteId: note.value.id,
            repostId: null,
          }),
        {}
      )

      return {}
    }).pipe(
      withDbTransaction,
      withNoteAdminActionRedisLock(req.payload.adminId),
      makeEndpointEffect
    )
)
