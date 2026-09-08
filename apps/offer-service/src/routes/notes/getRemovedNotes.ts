import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Array, Effect} from 'effect'
import {NoteDbService} from '../../db/NoteDbService'

export const getRemovedNotes = makeHttpApiHandler(
  OfferApiSpecification,
  'Notes',
  'getRemovedNotes',
  (req) =>
    Effect.gen(function* () {
      const security = yield* CurrentSecurity
      const noteDb = yield* NoteDbService

      const existingIds = yield* noteDb.queryNoteIdsForUser({
        userPublicKey: security.publicKey,
        userPublicKeyV2: security.publicKeyV2,
      })

      const nonExistingIds = Array.filter(
        req.payload.noteIds,
        (id) => !Array.contains(existingIds, id)
      )

      return {noteIds: nonExistingIds}
    }).pipe(makeEndpointEffect)
)
