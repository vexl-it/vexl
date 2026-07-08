import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  NoteAdminId,
  NoteId,
  NoteRepostId,
} from '@vexl-next/domain/src/general/notes'
import {
  PrivatePayloadEncrypted,
  PublicPayloadEncrypted,
} from '@vexl-next/domain/src/general/offers'
import {IdNumeric} from '@vexl-next/domain/src/utility/IdNumeric'
import {IsoDatetimeString} from '@vexl-next/domain/src/utility/IsoDatetimeString.brand'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {createPageResponse, PageRequestMeta} from '../../Pagination.brand'
import {CommaSeparatedDedupedStrings} from '../../utils'

export class ReportNoteLimitReachedError extends Schema.TaggedError<ReportNoteLimitReachedError>(
  'ReportNoteLimitReachedError'
)('ReportNoteLimitReachedError', {
  status: Schema.optionalWith(Schema.Literal(429), {default: () => 429}),
}) {}

export class InvalidNoteExpirationError extends Schema.TaggedError<InvalidNoteExpirationError>(
  'InvalidNoteExpirationError'
)('InvalidNoteExpirationError', {
  status: Schema.Literal(400),
}) {}

export const ServerNote = Schema.Struct({
  id: IdNumeric,
  noteId: NoteId,
  expiresAt: UnixMilliseconds,
  publicPayload: PublicPayloadEncrypted,
  privatePayload: PrivatePayloadEncrypted,
  createdAt: IsoDatetimeString,
  modifiedAt: IsoDatetimeString,
})
export type ServerNote = typeof ServerNote.Type

export const ServerNotePrivatePart = Schema.Struct({
  userPublicKey: Schema.Union(PublicKeyPemBase64, PublicKeyV2),
  payloadPrivate: PrivatePayloadEncrypted,
})
export type ServerNotePrivatePart = typeof ServerNotePrivatePart.Type

export const CreateNewNoteRequest = Schema.Struct({
  noteId: NoteId,
  adminId: NoteAdminId,
  payloadPublic: PublicPayloadEncrypted,
  notePrivateList: Schema.Array(ServerNotePrivatePart),
  expiresAt: UnixMilliseconds,
})
export type CreateNewNoteRequest = typeof CreateNewNoteRequest.Type

export const CreateNewNoteResponse = ServerNote
export type CreateNewNoteResponse = typeof CreateNewNoteResponse.Type

export const CreateNotePrivatePartRequest = Schema.Struct({
  adminId: NoteAdminId,
  notePrivateList: Schema.Array(ServerNotePrivatePart),
})
export type CreateNotePrivatePartRequest =
  typeof CreateNotePrivatePartRequest.Type

export const CreateNotePrivatePartResponse = NoContentResponse
export type CreateNotePrivatePartResponse =
  typeof CreateNotePrivatePartResponse.Type

export const DeleteNotePrivatePartRequest = Schema.Struct({
  adminIds: Schema.Array(NoteAdminId),
  publicKeys: Schema.Array(Schema.Union(PublicKeyPemBase64, PublicKeyV2)),
})
export type DeleteNotePrivatePartRequest =
  typeof DeleteNotePrivatePartRequest.Type

export const DeleteNotePrivatePartResponse = NoContentResponse
export type DeleteNotePrivatePartResponse =
  typeof DeleteNotePrivatePartResponse.Type

export const DeleteNoteRequest = Schema.Struct({
  adminIds: CommaSeparatedDedupedStrings.pipe(
    Schema.compose(Schema.Array(NoteAdminId))
  ),
})
export type DeleteNoteRequest = typeof DeleteNoteRequest.Type

export const DeleteNoteResponse = NoContentResponse
export type DeleteNoteResponse = typeof DeleteNoteResponse.Type

export const RepostNoteRequest = Schema.Struct({
  noteId: NoteId,
  repostId: NoteRepostId,
  notePrivateList: Schema.Array(ServerNotePrivatePart),
})
export type RepostNoteRequest = typeof RepostNoteRequest.Type

export const RepostNoteResponse = NoContentResponse
export type RepostNoteResponse = typeof RepostNoteResponse.Type

export const UndoRepostNoteRequest = Schema.Struct({
  repostIds: CommaSeparatedDedupedStrings.pipe(
    Schema.compose(Schema.Array(NoteRepostId))
  ),
})
export type UndoRepostNoteRequest = typeof UndoRepostNoteRequest.Type

export const UndoRepostNoteResponse = NoContentResponse
export type UndoRepostNoteResponse = typeof UndoRepostNoteResponse.Type

export const GetNotesForMeCreatedOrModifiedAfterPaginatedRequest =
  PageRequestMeta
export type GetNotesForMeCreatedOrModifiedAfterPaginatedRequest =
  typeof GetNotesForMeCreatedOrModifiedAfterPaginatedRequest.Type

export const GetNotesForMeCreatedOrModifiedAfterPaginatedResponse =
  createPageResponse(ServerNote)
export type GetNotesForMeCreatedOrModifiedAfterPaginatedResponse =
  typeof GetNotesForMeCreatedOrModifiedAfterPaginatedResponse.Type

export const RemovedNoteIdsRequest = Schema.Struct({
  noteIds: Schema.Array(NoteId),
})
export type RemovedNoteIdsRequest = typeof RemovedNoteIdsRequest.Type

export const RemovedNoteIdsResponse = RemovedNoteIdsRequest
export type RemovedNoteIdsResponse = typeof RemovedNoteIdsResponse.Type

export const ReportNoteRequest = Schema.Struct({
  noteId: NoteId,
})
export type ReportNoteRequest = typeof ReportNoteRequest.Type

export const ReportNoteResponse = NoContentResponse
export type ReportNoteResponse = typeof ReportNoteResponse.Type
