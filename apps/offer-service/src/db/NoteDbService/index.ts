import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type NoteId} from '@vexl-next/domain/src/general/notes'
import {Context, Effect, Layer, type Option} from 'effect'
import {
  type NoteParts,
  type NotePartsWithNoteForUserUpdateCounter,
  type NotePublicPartRecord,
  type NoteRepostIdHashed,
} from './domain'
import {createDeleteExpiredNotes} from './queries/createDeleteExpiredNotes'
import {createDeleteNotePrivatePartsByRepostId} from './queries/createDeleteNotePrivatePartsByRepostId'
import {createDeleteNotePublicPart} from './queries/createDeleteNotePublicPart'
import {createDeleteNoteReportedRecordByReportedAtBefore} from './queries/createDeleteNoteReportedRecordByReportedAtBefore'
import {
  createInsertNotePrivatePart,
  type InsertNotePrivatePartRequest,
} from './queries/createInsertNotePrivatePart'
import {
  createInsertNotePublicPart,
  type InsertNotePublicPartRequest,
} from './queries/createInsertNotePublicPart'
import {
  createInsertNoteReportedRecord,
  type InsertNoteReportedRecordParams,
} from './queries/createInsertNoteReportedRecord'
import {
  createQueryNoteByPublicKeyAndNoteId,
  type QueryNoteByPublicKeyAndNoteIdRequest,
} from './queries/createQueryNoteByPublicKeyAndNoteId'
import {
  createQueryNoteIdsForUser,
  type QueryNoteIdsForUserRequest,
} from './queries/createQueryNoteIdsForUser'
import {
  createQueryNotePublicPartByAdminId,
  type QueryNoteByAdminIdRequest,
} from './queries/createQueryNotePublicPartByAdminId'
import {createQueryNotePublicPartByNoteId} from './queries/createQueryNotePublicPartByNoteId'
import {
  createQueryNotesForUserPaginated,
  type QueryNotesPaginatedRequest,
} from './queries/createQueryNotesForUserPaginated'
import {createQueryNumberOfNoteReportsForUser} from './queries/createQueryNumberOfNoteReportsForUser'
import {
  createUpdateReportNote,
  type UpdateReportNoteRequest,
} from './queries/createUpdateReportNote'

export interface NoteDbOperations {
  queryNotesForUserPaginated: (
    args: QueryNotesPaginatedRequest
  ) => Effect.Effect<
    readonly NotePartsWithNoteForUserUpdateCounter[],
    UnexpectedServerError
  >

  queryNoteByPublicKeyAndNoteId: (
    args: QueryNoteByPublicKeyAndNoteIdRequest
  ) => Effect.Effect<Option.Option<NoteParts>, UnexpectedServerError>

  queryNoteIdsForUser: (
    args: QueryNoteIdsForUserRequest
  ) => Effect.Effect<readonly NoteId[], UnexpectedServerError>

  queryNumberOfNoteReportsForUser: (
    args: PublicKeyPemBase64
  ) => Effect.Effect<number, UnexpectedServerError>

  queryNotePublicPartByAdminId: (
    args: QueryNoteByAdminIdRequest
  ) => Effect.Effect<Option.Option<NotePublicPartRecord>, UnexpectedServerError>

  queryNotePublicPartByNoteId: (
    args: NoteId
  ) => Effect.Effect<Option.Option<NotePublicPartRecord>, UnexpectedServerError>

  insertNotePublicPart: (
    args: InsertNotePublicPartRequest
  ) => Effect.Effect<NotePublicPartRecord, UnexpectedServerError>

  insertNotePrivatePart: (
    args: InsertNotePrivatePartRequest
  ) => Effect.Effect<void, UnexpectedServerError>

  insertNoteReportedRecord: (
    args: InsertNoteReportedRecordParams
  ) => Effect.Effect<void, UnexpectedServerError>

  updateReportNote: (
    args: UpdateReportNoteRequest
  ) => Effect.Effect<void, UnexpectedServerError>

  deleteNotePublicPart: (
    args: QueryNoteByAdminIdRequest
  ) => Effect.Effect<void, UnexpectedServerError>

  deleteNotePrivatePartsByRepostId: (
    args: NoteRepostIdHashed
  ) => Effect.Effect<void, UnexpectedServerError>

  deleteExpiredNotes: () => Effect.Effect<void, UnexpectedServerError>

  deleteNoteReportedRecordByReportedAtBefore: (
    args: number
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class NoteDbService extends Context.Tag('NoteDbService')<
  NoteDbService,
  NoteDbOperations
>() {
  static readonly Live = Layer.effect(
    NoteDbService,
    Effect.gen(function* (_) {
      return {
        queryNotesForUserPaginated: yield* _(createQueryNotesForUserPaginated),
        queryNoteByPublicKeyAndNoteId: yield* _(
          createQueryNoteByPublicKeyAndNoteId
        ),
        queryNoteIdsForUser: yield* _(createQueryNoteIdsForUser),
        queryNumberOfNoteReportsForUser: yield* _(
          createQueryNumberOfNoteReportsForUser
        ),
        queryNotePublicPartByAdminId: yield* _(
          createQueryNotePublicPartByAdminId
        ),
        queryNotePublicPartByNoteId: yield* _(
          createQueryNotePublicPartByNoteId
        ),
        insertNotePublicPart: yield* _(createInsertNotePublicPart),
        insertNotePrivatePart: yield* _(createInsertNotePrivatePart),
        insertNoteReportedRecord: yield* _(createInsertNoteReportedRecord),
        updateReportNote: yield* _(createUpdateReportNote),
        deleteNotePublicPart: yield* _(createDeleteNotePublicPart),
        deleteNotePrivatePartsByRepostId: yield* _(
          createDeleteNotePrivatePartsByRepostId
        ),
        deleteExpiredNotes: yield* _(createDeleteExpiredNotes),
        deleteNoteReportedRecordByReportedAtBefore: yield* _(
          createDeleteNoteReportedRecordByReportedAtBefore
        ),
      }
    })
  )
}
