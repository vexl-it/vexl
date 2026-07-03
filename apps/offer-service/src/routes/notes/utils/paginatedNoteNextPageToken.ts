import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {
  base64UrlStringToDecoded,
  objectToBase64UrlEncoded,
} from '@vexl-next/generic-utils/src/base64NextPageTokenEncoding'
import {Effect, Schema} from 'effect'
import {
  NoteChangeCounter,
  NotePrivatePartRecordId,
  type NotePartsWithNoteForUserUpdateCounter,
} from '../../../db/NoteDbService/domain'

const DEFAULT_LAST_NOTE_CHANGE_COUNTER =
  Schema.decodeSync(NoteChangeCounter)('0')
const DEFAULT_LAST_PRIVATE_PART_ID = Schema.decodeSync(NotePrivatePartRecordId)(
  '0'
)

export const PaginatedNoteNextPageToken = Schema.Struct({
  lastNoteChangeCounter: NoteChangeCounter,
  lastPrivatePartId: NotePrivatePartRecordId,
})
export type PaginatedNoteNextPageToken = typeof PaginatedNoteNextPageToken.Type

export const defaultPaginatedNoteNextPageToken: PaginatedNoteNextPageToken = {
  lastNoteChangeCounter: DEFAULT_LAST_NOTE_CHANGE_COUNTER,
  lastPrivatePartId: DEFAULT_LAST_PRIVATE_PART_ID,
}

export const decodePaginatedNoteNextPageToken = ({
  nextPageToken,
}: {
  nextPageToken: string | undefined
}): Effect.Effect<PaginatedNoteNextPageToken, InvalidNextPageTokenError> =>
  Effect.gen(function* (_) {
    if (!nextPageToken) {
      return defaultPaginatedNoteNextPageToken
    }

    return yield* _(
      base64UrlStringToDecoded({
        base64UrlString: nextPageToken,
        decodeSchema: PaginatedNoteNextPageToken,
      })
    )
  }).pipe(
    Effect.catchTag('ParseError', (cause) =>
      Effect.fail(
        new InvalidNextPageTokenError({
          cause,
        })
      )
    )
  )

export const encodePaginatedNoteNextPageToken = ({
  note,
}: {
  note: NotePartsWithNoteForUserUpdateCounter
}): Effect.Effect<string, InvalidNextPageTokenError> =>
  objectToBase64UrlEncoded({
    object: {
      lastNoteChangeCounter: note.noteForUserUpdateCounter,
      lastPrivatePartId: note.privatePart.id,
    },
    schema: PaginatedNoteNextPageToken,
  }).pipe(
    Effect.catchTag('ParseError', (cause) =>
      Effect.fail(
        new InvalidNextPageTokenError({
          cause,
        })
      )
    )
  )
