import {Schema} from 'effect'
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
} from 'effect/unstable/httpapi'
import {commonApiErrors} from '../../commonApiErrors'
import {CommonHeaders} from '../../commonHeaders'
import {MaxExpectedDailyCall} from '../../MaxExpectedDailyCountAnnotation'
import {NoContentResponse} from '../../NoContentResponse.brand'
import {RateLimitingMiddleware} from '../../rateLimititing'
import {
  CreateNotificationSecretRequest,
  CreateNotificationSecretResponse,
  GenerateNotificationTokenRequest,
  GenerateNotificationTokenResponse,
  GetPublicKeyResponse,
  InvalidateNotificationSecretRequest,
  InvalidateNotificationTokenRequest,
  InvalidFcmCypherError,
  InvalidNotificationCypherrror,
  IssueNotificationRequest,
  IssueNotificationResponse,
  IssueStreamOnlyMessageRequest,
  MissingCommonHeadersError,
  ReportNotificationProcessedRequest,
  SendingNotificationError,
  UpdateNotificationInfoRequest,
} from './contract'

export const IssueNotificationEndpoint = HttpApiEndpoint.post(
  'issueNotification',
  '/issue-notification',
  {
    disableCodecs: true,
    payload: Schema.Struct(IssueNotificationRequest.fields),
    error: Schema.Union([
      ...commonApiErrors,
      InvalidFcmCypherError.pipe(HttpApiSchema.status(400)),
      SendingNotificationError.pipe(HttpApiSchema.status(400)),
      InvalidNotificationCypherrror.pipe(HttpApiSchema.status(400)),
    ]),
    success: Schema.Struct(IssueNotificationResponse.fields),
  }
).annotate(MaxExpectedDailyCall, 5000)

export const IssueStreamOnlyMessageEndpoint = HttpApiEndpoint.post(
  'issueStreamOnlyMessage',
  '/issue-stream-only-message',
  {
    disableCodecs: true,
    payload: Schema.Struct(IssueStreamOnlyMessageRequest.fields),
    error: Schema.Union([...commonApiErrors, SendingNotificationError]),
    success: NoContentResponse,
  }
).annotate(MaxExpectedDailyCall, 500_000)

export const ReportNotificationProcessedEndpoint = HttpApiEndpoint.post(
  'reportNotificationProcessed',
  '/report-notification',
  {
    disableCodecs: true,
    headers: CommonHeaders,
    payload: Schema.Struct(ReportNotificationProcessedRequest.fields),
    error: Schema.Union([...commonApiErrors]),
    success: NoContentResponse,
  }
).annotate(MaxExpectedDailyCall, 5000)

export const GetNotificationPublicKeyEndpoint = HttpApiEndpoint.get(
  'getNotificationPublicKey',
  '/cypher-public-key',
  {
    disableCodecs: true,
    error: Schema.Union([...commonApiErrors]),
    success: GetPublicKeyResponse,
  }
).annotate(MaxExpectedDailyCall, 100)

const RootGroup = HttpApiGroup.make('root', {topLevel: true})
  .add(IssueNotificationEndpoint)
  .add(ReportNotificationProcessedEndpoint)
  .add(IssueStreamOnlyMessageEndpoint)
  .add(GetNotificationPublicKeyEndpoint)

export const CreateNotificationSecretEndpoint = HttpApiEndpoint.post(
  'CreateNotificationSecret',
  '/token/create-secret',
  {
    disableCodecs: true,
    payload: Schema.Struct(CreateNotificationSecretRequest.fields),
    headers: CommonHeaders,
    error: Schema.Union([
      ...commonApiErrors,
      MissingCommonHeadersError.pipe(HttpApiSchema.status(400)),
    ]),
    success: Schema.Struct(CreateNotificationSecretResponse.fields),
  }
).annotate(MaxExpectedDailyCall, 10)

export const UpdateNotificationInfoEndpont = HttpApiEndpoint.put(
  'updateNoficationInfo',
  '/token/update',
  {
    disableCodecs: true,
    payload: Schema.Struct(UpdateNotificationInfoRequest.fields),
    headers: CommonHeaders,
    error: Schema.Union([
      ...commonApiErrors,
      MissingCommonHeadersError.pipe(HttpApiSchema.status(400)),
    ]),
  }
).annotate(MaxExpectedDailyCall, 100)

export const GenerateNotificationTokenEndpoint = HttpApiEndpoint.post(
  'generateNotificationToken',
  '/token/generate',
  {
    disableCodecs: true,
    payload: Schema.Struct(GenerateNotificationTokenRequest.fields),
    error: Schema.Union([...commonApiErrors]),
    success: Schema.Struct(GenerateNotificationTokenResponse.fields),
  }
).annotate(MaxExpectedDailyCall, 1_000)

export const InvalidateNotificationTokenEndpoint = HttpApiEndpoint.delete(
  'invalidateNotificationToken',
  '/token/invalidate',
  {
    disableCodecs: true,
    payload: Schema.Struct(InvalidateNotificationTokenRequest.fields),
    error: Schema.Union([...commonApiErrors]),
  }
).annotate(MaxExpectedDailyCall, 1_000)

export const InvalidateNotificationSecretEndpoint = HttpApiEndpoint.delete(
  'invalidateNotificationSecret',
  '/token/invalidate/secret',
  {
    disableCodecs: true,
    payload: Schema.Struct(InvalidateNotificationSecretRequest.fields),
    error: Schema.Union([...commonApiErrors]),
  }
).annotate(MaxExpectedDailyCall, 1_000)

const NotificationTokenGroup = HttpApiGroup.make('NotificationTokenGroup')
  .add(CreateNotificationSecretEndpoint)
  .add(UpdateNotificationInfoEndpont)
  .add(GenerateNotificationTokenEndpoint)
  .add(InvalidateNotificationTokenEndpoint)
  .add(InvalidateNotificationSecretEndpoint)

export const NotificationApiSpecification = HttpApi.make('Notification API')
  .add(RootGroup)
  .add(NotificationTokenGroup)
  .middleware(RateLimitingMiddleware)
