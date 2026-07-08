import {HttpApiEndpoint, HttpApiGroup, OpenApi} from '@effect/platform/index'
import {
  InvalidNextPageTokenError,
  NotFoundError,
} from '@vexl-next/domain/src/general/commonErrors'
import {
  CommonAndSecurityHeaders,
  ServerSecurityMiddleware,
} from '../../apiSecurity'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {
  CanNotDeletePrivatePartOfAuthor,
  DuplicatedPublicKeyError,
  MissingOwnerPrivatePartError,
} from './contracts'
import {
  CreateNewNoteRequest,
  CreateNewNoteResponse,
  CreateNotePrivatePartRequest,
  CreateNotePrivatePartResponse,
  CreateRepostNotePrivatePartRequest,
  CreateRepostNotePrivatePartResponse,
  DeleteNotePrivatePartRequest,
  DeleteNotePrivatePartResponse,
  DeleteNoteRequest,
  DeleteNoteResponse,
  GetNotesForMeCreatedOrModifiedAfterPaginatedRequest,
  GetNotesForMeCreatedOrModifiedAfterPaginatedResponse,
  InvalidNoteExpirationError,
  RemovedNoteIdsRequest,
  RemovedNoteIdsResponse,
  ReportNoteLimitReachedError,
  ReportNoteRequest,
  ReportNoteResponse,
  RepostNoteRequest,
  RepostNoteResponse,
  UndoRepostNoteRequest,
  UndoRepostNoteResponse,
} from './notesContracts'

export const CreateNewNoteEndpoint = HttpApiEndpoint.post(
  'createNewNote',
  '/api/v1/notes'
)
  .annotate(OpenApi.Summary, 'Create note')
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setPayload(CreateNewNoteRequest)
  .addSuccess(CreateNewNoteResponse)
  .addError(MissingOwnerPrivatePartError, {status: 400})
  .addError(DuplicatedPublicKeyError, {status: 400})
  .addError(InvalidNoteExpirationError, {status: 400})
  .annotate(MaxExpectedDailyCall, 50)

export const CreateNotePrivatePartEndpoint = HttpApiEndpoint.post(
  'createNotePrivatePart',
  '/api/v1/notes/private-part'
)
  .annotate(OpenApi.Summary, 'Create note private part')
  .setPayload(CreateNotePrivatePartRequest)
  .addSuccess(CreateNotePrivatePartResponse)
  .addError(DuplicatedPublicKeyError, {status: 400})
  .annotate(MaxExpectedDailyCall, 100)

export const DeleteNotePrivatePartEndpoint = HttpApiEndpoint.del(
  'deleteNotePrivatePart',
  '/api/v1/notes/private-part'
)
  .annotate(OpenApi.Summary, 'Delete note private part')
  .annotate(
    OpenApi.Description,
    'Removes direct (non repost) private parts of the given public keys. When note for one of adminIds is not found, no error is returned'
  )
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setPayload(DeleteNotePrivatePartRequest)
  .addSuccess(DeleteNotePrivatePartResponse)
  .addError(CanNotDeletePrivatePartOfAuthor, {status: 400})
  .annotate(MaxExpectedDailyCall, 100)

export const CreateRepostNotePrivatePartEndpoint = HttpApiEndpoint.post(
  'createRepostNotePrivatePart',
  '/api/v1/notes/repost/private-part'
)
  .annotate(OpenApi.Summary, 'Create repost note private part')
  .setPayload(CreateRepostNotePrivatePartRequest)
  .addSuccess(CreateRepostNotePrivatePartResponse)
  .addError(DuplicatedPublicKeyError, {status: 400})
  .addError(NotFoundError, {status: 404})
  .annotate(MaxExpectedDailyCall, 100)

export const DeleteNoteEndpoint = HttpApiEndpoint.del(
  'deleteNote',
  '/api/v1/notes'
)
  .annotate(OpenApi.Summary, 'Delete note')
  .setUrlParams(DeleteNoteRequest)
  .addSuccess(DeleteNoteResponse)
  .annotate(MaxExpectedDailyCall, 50)

export const RepostNoteEndpoint = HttpApiEndpoint.post(
  'repostNote',
  '/api/v1/notes/repost'
)
  .annotate(OpenApi.Summary, 'Repost note')
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setPayload(RepostNoteRequest)
  .addSuccess(RepostNoteResponse)
  .addError(NotFoundError, {status: 404})
  .addError(DuplicatedPublicKeyError, {status: 400})
  .annotate(MaxExpectedDailyCall, 50)

export const UndoRepostNoteEndpoint = HttpApiEndpoint.del(
  'undoRepostNote',
  '/api/v1/notes/repost'
)
  .annotate(OpenApi.Summary, 'Undo repost note')
  .setUrlParams(UndoRepostNoteRequest)
  .addSuccess(UndoRepostNoteResponse)
  .annotate(MaxExpectedDailyCall, 50)

export const GetNotesForMeModifiedOrCreatedAfterPaginatedEndpoint =
  HttpApiEndpoint.get(
    'getNotesForMeModifiedOrCreatedAfterPaginated',
    '/api/v1/notes/me/modified/paginated'
  )
    .annotate(
      OpenApi.Summary,
      'Get notes for me modified or created after (paginated)'
    )
    .setHeaders(CommonAndSecurityHeaders)
    .middleware(ServerSecurityMiddleware)
    .setUrlParams(GetNotesForMeCreatedOrModifiedAfterPaginatedRequest)
    .addSuccess(GetNotesForMeCreatedOrModifiedAfterPaginatedResponse)
    .addError(InvalidNextPageTokenError, {status: 400})
    .annotate(MaxExpectedDailyCall, 600)

export const GetRemovedNotesEndpoint = HttpApiEndpoint.post(
  'getRemovedNotes',
  '/api/v1/notes/not-exist'
)
  .annotate(OpenApi.Summary, 'Get removed notes')
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setPayload(RemovedNoteIdsRequest)
  .addSuccess(RemovedNoteIdsResponse)
  .annotate(MaxExpectedDailyCall, 100)

export const ReportNoteEndpoint = HttpApiEndpoint.post(
  'reportNote',
  '/api/v1/notes/report'
)
  .annotate(OpenApi.Summary, 'Report note')
  .setHeaders(CommonAndSecurityHeaders)
  .middleware(ServerSecurityMiddleware)
  .setPayload(ReportNoteRequest)
  .addSuccess(ReportNoteResponse)
  .addError(ReportNoteLimitReachedError, {status: 429})
  .addError(NotFoundError, {status: 404})
  .annotate(MaxExpectedDailyCall, 10)

export const NotesApiGroup = HttpApiGroup.make('Notes')
  .add(CreateNewNoteEndpoint)
  .add(CreateNotePrivatePartEndpoint)
  .add(DeleteNotePrivatePartEndpoint)
  .add(CreateRepostNotePrivatePartEndpoint)
  .add(DeleteNoteEndpoint)
  .add(RepostNoteEndpoint)
  .add(UndoRepostNoteEndpoint)
  .add(GetNotesForMeModifiedOrCreatedAfterPaginatedEndpoint)
  .add(GetRemovedNotesEndpoint)
  .add(ReportNoteEndpoint)
