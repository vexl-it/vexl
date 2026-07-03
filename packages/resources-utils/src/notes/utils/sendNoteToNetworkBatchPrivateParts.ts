import {
  type NoteAdminId,
  type NoteId,
} from '@vexl-next/domain/src/general/notes'
import {type PublicPayloadEncrypted} from '@vexl-next/domain/src/general/offers'
import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {type ServerNotePrivatePart} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {Array, Effect, pipe} from 'effect'
import {PRIVATE_PARTS_BATCH_SIZE} from '../../offers/privatePartsUploadBatchSize'

export const sendNoteToNetworkBatchPrivateParts = ({
  offerApi,
  noteData,
}: {
  offerApi: OfferApi
  noteData: {
    ownerPrivatePayload: ServerNotePrivatePart
    payloadPublic: PublicPayloadEncrypted
    notePrivateList: readonly ServerNotePrivatePart[]
    adminId: NoteAdminId
    noteId: NoteId
    expiresAt: UnixMilliseconds
  }
}): ReturnType<OfferApi['createNewNote']> =>
  Effect.gen(function* (_) {
    const privatePartsBatches = Array.chunksOf(
      noteData.notePrivateList,
      PRIVATE_PARTS_BATCH_SIZE
    )

    const [firstBatch, ...restOfBatches] = privatePartsBatches

    const createRequest = yield* _(
      offerApi.createNewNote({
        noteId: noteData.noteId,
        adminId: noteData.adminId,
        payloadPublic: noteData.payloadPublic,
        expiresAt: noteData.expiresAt,
        notePrivateList: [noteData.ownerPrivatePayload, ...(firstBatch ?? [])],
      })
    )

    yield* _(
      pipe(
        restOfBatches ?? [],
        Array.map((notePrivateList) =>
          offerApi.createNotePrivatePart({
            notePrivateList,
            adminId: noteData.adminId,
          })
        ),
        Effect.all,
        Effect.tapError(() =>
          offerApi
            .deleteNote({adminIds: [noteData.adminId]})
            .pipe(
              Effect.ignore,
              Effect.zipLeft(
                Effect.log(
                  'Error while creating note. Cleaning up any already created private parts.'
                )
              )
            )
        )
      )
    )

    return createRequest
  })
