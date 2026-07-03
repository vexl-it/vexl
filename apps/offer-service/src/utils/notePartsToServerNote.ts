import {fromJsDate} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {fromDate} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type ServerNote} from '@vexl-next/rest-api/src/services/offer/notesContracts'
import {type NoteParts} from '../db/NoteDbService/domain'

export const notePartsToServerNote = (noteParts: NoteParts): ServerNote =>
  ({
    id: noteParts.privatePart.id,
    noteId: noteParts.publicPart.noteId,
    expiresAt: fromDate(noteParts.publicPart.expiresAt),
    publicPayload: noteParts.publicPart.payloadPublic,
    privatePayload: noteParts.privatePart.payloadPrivate,
    createdAt: fromJsDate(noteParts.publicPart.createdAt),
    modifiedAt: fromJsDate(noteParts.publicPart.createdAt),
  }) satisfies ServerNote
