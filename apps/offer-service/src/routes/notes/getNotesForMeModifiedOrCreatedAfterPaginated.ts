import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Array, Effect, Option} from 'effect'
import {NoteDbService} from '../../db/NoteDbService'
import {notePartsToServerNote} from '../../utils/notePartsToServerNote'
import {
  decodePaginatedNoteNextPageToken,
  encodePaginatedNoteNextPageToken,
} from './utils/paginatedNoteNextPageToken'

export const getNotesForMeModifiedOrCreatedAfterPaginated = makeHttpApiHandler(
  OfferApiSpecification,
  'Notes',
  'getNotesForMeModifiedOrCreatedAfterPaginated',
  (req) =>
    Effect.gen(function* () {
      const security = yield* CurrentSecurity
      const noteDb = yield* NoteDbService

      // + 1 so we know if there is a next page
      const increasedLimit = req.query.limit + 1
      const {lastNoteChangeCounter, lastPrivatePartId} =
        yield* decodePaginatedNoteNextPageToken({
          nextPageToken: req.query.nextPageToken,
        })

      const notes = yield* noteDb.queryNotesForUserPaginated({
        userPublicKey: security.publicKey,
        userPublicKeyV2: security.publicKeyV2,
        lastNoteChangeCounter,
        lastPrivatePartId,
        limit: increasedLimit,
      })

      const isThereNextPage = notes.length === increasedLimit
      const notesToReturn = Array.take(req.query.limit)(notes)
      const lastElementOfThisPage = Array.last(notesToReturn)
      const nextPageToken = Option.isSome(lastElementOfThisPage)
        ? yield* encodePaginatedNoteNextPageToken({
            note: lastElementOfThisPage.value,
          })
        : null

      return {
        nextPageToken,
        hasNext: isThereNextPage,
        limit: req.query.limit,
        items: Array.map(notePartsToServerNote)(notesToReturn),
      }
    }).pipe(makeEndpointEffect)
)
