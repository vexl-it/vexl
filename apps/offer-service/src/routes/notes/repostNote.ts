import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {DuplicatedPublicKeyError} from '@vexl-next/rest-api/src/services/offer/contracts'
import {type ServerNotePrivatePart} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, Option} from 'effect'
import {NoteDbService} from '../../db/NoteDbService'
import {hashNoteRepostId} from '../../utils/hashNoteIds'
import {withNoteRepostActionRedisLock} from '../../utils/withNoteRedisLock'

const isWithoutDuplicates = (
  privateList: readonly ServerNotePrivatePart[]
): boolean => {
  const deduped = Array.dedupeWith<readonly ServerNotePrivatePart[]>(
    (a, b) => a.userPublicKey === b.userPublicKey
  )(privateList)

  return Array.length(deduped) === Array.length(privateList)
}

export const repostNote = makeHttpApiHandler(
  OfferApiSpecification,
  'Notes',
  'repostNote',
  (req) =>
    Effect.gen(function* () {
      const security = yield* CurrentSecurity
      const noteDb = yield* NoteDbService

      if (!isWithoutDuplicates(req.payload.notePrivateList)) {
        return yield* Effect.fail(new DuplicatedPublicKeyError({status: 400}))
      }

      const note = yield* noteDb.queryNoteByPublicKeyAndNoteId({
        userPublicKey: security.publicKey,
        userPublicKeyV2: security.publicKeyV2,
        id: req.payload.noteId,
      })
      if (Option.isNone(note)) {
        return yield* Effect.fail(new NotFoundError())
      }

      const hashedRepostId = yield* hashNoteRepostId(req.payload.repostId)

      // Duplicates against already existing rows are allowed by design
      // (spec §4.6); the repost parts are tagged with the encrypted repostId
      // so the reposter can later undo exactly these rows.
      yield* Effect.forEach(
        req.payload.notePrivateList,
        (privatePart) =>
          noteDb.insertNotePrivatePart({
            ...privatePart,
            noteId: note.value.publicPart.id,
            repostId: hashedRepostId,
          }),
        {}
      )

      return {}
    }).pipe(
      withDbTransaction,
      withNoteRepostActionRedisLock(req.payload.repostId),
      Effect.withSpan('repostNote'),
      makeEndpointEffect
    )
)
