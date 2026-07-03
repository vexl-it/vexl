import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect} from 'effect'
import {NoteDbService} from '../../db/NoteDbService'

export const getRemovedNotes = HttpApiBuilder.handler(
  OfferApiSpecification,
  'Notes',
  'getRemovedNotes',
  (req) =>
    Effect.gen(function* (_) {
      const security = yield* _(CurrentSecurity)
      const noteDb = yield* _(NoteDbService)

      const existingIds = yield* _(
        noteDb.queryNoteIdsForUser({
          userPublicKey: security.publicKey,
          userPublicKeyV2: security.publicKeyV2,
        })
      )

      const nonExistingIds = Array.filter(
        req.payload.noteIds,
        (id) => !Array.contains(existingIds, id)
      )

      return {noteIds: nonExistingIds}
    }).pipe(makeEndpointEffect)
)
