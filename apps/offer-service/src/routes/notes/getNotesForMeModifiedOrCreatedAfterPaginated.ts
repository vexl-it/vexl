import {HttpApiBuilder} from '@effect/platform/index'
import {CurrentSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, Option} from 'effect'
import {NoteDbService} from '../../db/NoteDbService'
import {notePartsToServerNote} from '../../utils/notePartsToServerNote'
import {
  decodePaginatedNoteNextPageToken,
  encodePaginatedNoteNextPageToken,
} from './utils/paginatedNoteNextPageToken'

export const getNotesForMeModifiedOrCreatedAfterPaginated =
  HttpApiBuilder.handler(
    OfferApiSpecification,
    'Notes',
    'getNotesForMeModifiedOrCreatedAfterPaginated',
    (req) =>
      Effect.gen(function* (_) {
        const security = yield* _(CurrentSecurity)
        const noteDb = yield* _(NoteDbService)

        // + 1 so we know if there is a next page
        const increasedLimit = req.urlParams.limit + 1
        const {lastNoteChangeCounter, lastPrivatePartId} = yield* _(
          decodePaginatedNoteNextPageToken({
            nextPageToken: req.urlParams.nextPageToken,
          })
        )

        const notes = yield* _(
          noteDb.queryNotesForUserPaginated({
            userPublicKey: security.publicKey,
            userPublicKeyV2: security.publicKeyV2,
            lastNoteChangeCounter,
            lastPrivatePartId,
            limit: increasedLimit,
          })
        )

        const isThereNextPage = notes.length === increasedLimit
        const notesToReturn = Array.take(req.urlParams.limit)(notes)
        const lastElementOfThisPage = Array.last(notesToReturn)
        const nextPageToken = Option.isSome(lastElementOfThisPage)
          ? yield* _(
              encodePaginatedNoteNextPageToken({
                note: lastElementOfThisPage.value,
              })
            )
          : null

        return {
          nextPageToken,
          hasNext: isThereNextPage,
          limit: req.urlParams.limit,
          items: Array.map(notePartsToServerNote)(notesToReturn),
        }
      }).pipe(makeEndpointEffect)
  )
