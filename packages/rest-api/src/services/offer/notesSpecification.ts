import {InvalidNextPageTokenError} from '@vexl-next/domain/src/general/commonErrors'
import {Schema} from 'effect'
import {
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
  OpenApi,
} from 'effect/unstable/httpapi'
import {
  CommonAndSecurityHeaders,
  ServerSecurityMiddleware,
} from '../../apiSecurity'
import {commonApiErrors} from '../../commonApiErrors'
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
  '/api/v1/notes',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: CreateNewNoteRequest,
    error: Schema.Union([
      ...commonApiErrors,
      MissingOwnerPrivatePartError.pipe(HttpApiSchema.status(400)),
      DuplicatedPublicKeyError.pipe(HttpApiSchema.status(400)),
      InvalidNoteExpirationError.pipe(HttpApiSchema.status(400)),
    ]),
    success: CreateNewNoteResponse,
  }
)
  .annotate(OpenApi.Summary, 'Create note')
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 50)

export const CreateNotePrivatePartEndpoint = HttpApiEndpoint.post(
  'createNotePrivatePart',
  '/api/v1/notes/private-part',
  {
    disableCodecs: true,
    payload: CreateNotePrivatePartRequest,
    error: Schema.Union([
      ...commonApiErrors,
      DuplicatedPublicKeyError.pipe(HttpApiSchema.status(400)),
    ]),
    success: CreateNotePrivatePartResponse,
  }
)
  .annotate(OpenApi.Summary, 'Create note private part')
  .annotate(MaxExpectedDailyCall, 100)

export const DeleteNotePrivatePartEndpoint = HttpApiEndpoint.delete(
  'deleteNotePrivatePart',
  '/api/v1/notes/private-part',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: DeleteNotePrivatePartRequest,
    error: Schema.Union([
      ...commonApiErrors,
      CanNotDeletePrivatePartOfAuthor.pipe(HttpApiSchema.status(400)),
    ]),
    success: DeleteNotePrivatePartResponse,
  }
)
  .annotate(OpenApi.Summary, 'Delete note private part')
  .annotate(
    OpenApi.Description,
    'Removes direct (non repost) private parts of the given public keys. When note for one of adminIds is not found, no error is returned'
  )
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 100)

export const CreateRepostNotePrivatePartEndpoint = HttpApiEndpoint.post(
  'createRepostNotePrivatePart',
  '/api/v1/notes/repost/private-part',
  {
    disableCodecs: true,
    payload: CreateRepostNotePrivatePartRequest,
    error: Schema.Union([
      ...commonApiErrors,
      DuplicatedPublicKeyError.pipe(HttpApiSchema.status(400)),
    ]),
    success: CreateRepostNotePrivatePartResponse,
  }
)
  .annotate(OpenApi.Summary, 'Create repost note private part')
  .annotate(MaxExpectedDailyCall, 100)

export const DeleteNoteEndpoint = HttpApiEndpoint.delete(
  'deleteNote',
  '/api/v1/notes',
  {
    disableCodecs: true,
    query: DeleteNoteRequest.fields,
    error: Schema.Union([...commonApiErrors]),
    success: DeleteNoteResponse,
  }
)
  .annotate(OpenApi.Summary, 'Delete note')
  .annotate(MaxExpectedDailyCall, 50)

export const RepostNoteEndpoint = HttpApiEndpoint.post(
  'repostNote',
  '/api/v1/notes/repost',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: RepostNoteRequest,
    error: Schema.Union([
      ...commonApiErrors,
      DuplicatedPublicKeyError.pipe(HttpApiSchema.status(400)),
    ]),
    success: RepostNoteResponse,
  }
)
  .annotate(OpenApi.Summary, 'Repost note')
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 50)

export const UndoRepostNoteEndpoint = HttpApiEndpoint.delete(
  'undoRepostNote',
  '/api/v1/notes/repost',
  {
    disableCodecs: true,
    query: UndoRepostNoteRequest.fields,
    error: Schema.Union([...commonApiErrors]),
    success: UndoRepostNoteResponse,
  }
)
  .annotate(OpenApi.Summary, 'Undo repost note')
  .annotate(MaxExpectedDailyCall, 50)

export const GetNotesForMeModifiedOrCreatedAfterPaginatedEndpoint =
  HttpApiEndpoint.get(
    'getNotesForMeModifiedOrCreatedAfterPaginated',
    '/api/v1/notes/me/modified/paginated',
    {
      disableCodecs: true,
      headers: CommonAndSecurityHeaders,
      query: GetNotesForMeCreatedOrModifiedAfterPaginatedRequest.fields,
      error: Schema.Union([
        ...commonApiErrors,
        InvalidNextPageTokenError.pipe(HttpApiSchema.status(400)),
      ]),
      success: GetNotesForMeCreatedOrModifiedAfterPaginatedResponse,
    }
  )
    .annotate(
      OpenApi.Summary,
      'Get notes for me modified or created after (paginated)'
    )
    .middleware(ServerSecurityMiddleware)
    .annotate(MaxExpectedDailyCall, 600)

export const GetRemovedNotesEndpoint = HttpApiEndpoint.post(
  'getRemovedNotes',
  '/api/v1/notes/not-exist',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: RemovedNoteIdsRequest,
    error: Schema.Union([...commonApiErrors]),
    success: RemovedNoteIdsResponse,
  }
)
  .annotate(OpenApi.Summary, 'Get removed notes')
  .middleware(ServerSecurityMiddleware)
  .annotate(MaxExpectedDailyCall, 100)

export const ReportNoteEndpoint = HttpApiEndpoint.post(
  'reportNote',
  '/api/v1/notes/report',
  {
    disableCodecs: true,
    headers: CommonAndSecurityHeaders,
    payload: ReportNoteRequest,
    error: Schema.Union([
      ...commonApiErrors,
      ReportNoteLimitReachedError.pipe(HttpApiSchema.status(429)),
    ]),
    success: ReportNoteResponse,
  }
)
  .annotate(OpenApi.Summary, 'Report note')
  .middleware(ServerSecurityMiddleware)
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
