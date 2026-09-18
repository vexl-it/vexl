import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect} from 'effect'
import {NoteDbService} from '../../../db/NoteDbService'
import {type InsertNotePrivatePartRequest} from '../../../db/NoteDbService/queries/createInsertNotePrivatePart'

// Call inside the sharing path's transaction and lock. Other direct/repost
// paths for the same recipient must survive the replacement.
export const replaceNotePrivateParts = (
  parts: readonly InsertNotePrivatePartRequest[]
): Effect.Effect<void, UnexpectedServerError, NoteDbService> =>
  Effect.gen(function* () {
    const db = yield* NoteDbService
    yield* Effect.forEach(parts, db.deleteNotePrivatePart, {batching: true})
    yield* Effect.forEach(parts, db.insertNotePrivatePart, {batching: true})
  })
