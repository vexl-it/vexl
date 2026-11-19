import {type PgClient} from '@effect/sql-pg'
import {type SqlError} from '@effect/sql/SqlError'
import * as Sentry from '@sentry/nextjs'
import {
  Effect,
  Schema,
  type ConfigError,
  type Either,
  type ParseResult,
} from 'effect'
import {NextResponse, type NextRequest} from 'next/server'
import {type BackofficeSection} from '../services/access/domain'
import {accessError, type AccessRequestError} from './access/errors'
import {requireSessionSection} from './access/session'
import {runDb} from './db'

export const jsonOk = <A>(data: A, status = 200): NextResponse =>
  NextResponse.json(data, {status})

export const badRequest = (message: string): NextResponse =>
  NextResponse.json({error: message}, {status: 400})

export const notFound = (message: string): NextResponse =>
  NextResponse.json({error: message}, {status: 404})

export const noContent = (): NextResponse =>
  new NextResponse(null, {status: 204})

export const decodeJsonBody = async <S extends Schema.Schema.AnyNoContext>(
  request: NextRequest,
  schema: S
): Promise<Either.Either<Schema.Schema.Type<S>, ParseResult.ParseError>> => {
  const body = await request.json()
  return Schema.decodeUnknownEither(schema)(body)
}

export const decodeBody = <A, I>(
  request: NextRequest,
  schema: Schema.Schema<A, I>
): Effect.Effect<A, AccessRequestError> =>
  Effect.tryPromise(() => request.json()).pipe(
    Effect.flatMap(Schema.decodeUnknown(schema)),
    Effect.mapError(() => accessError(400, 'Invalid request body'))
  )

const accessErrorResponse = (error: AccessRequestError): NextResponse =>
  NextResponse.json({error: error.message}, {status: error.status})

/** `null` when the signed-in passkey may use `section`, else the response to return. */
export const requireSection = (
  request: NextRequest,
  section: BackofficeSection
): Promise<NextResponse | null> =>
  runDb(
    requireSessionSection(request, section).pipe(
      Effect.as(null),
      Effect.catchTag('AccessRequestError', (error) =>
        Effect.succeed(accessErrorResponse(error))
      )
    )
  )

export const handleAccessRequest = async (
  handler: Effect.Effect<
    NextResponse,
    AccessRequestError | ConfigError.ConfigError | SqlError,
    PgClient.PgClient
  >
): Promise<NextResponse> => {
  try {
    return await runDb(
      handler.pipe(
        Effect.catchTag('AccessRequestError', (error) =>
          Effect.succeed(accessErrorResponse(error))
        )
      )
    )
  } catch (error) {
    return internalServerError(error)
  }
}

export const reportError = (error: unknown): void => {
  console.error('Backoffice API error:', error)
  Sentry.captureException(error)
}

export const internalServerError = (error: unknown): NextResponse => {
  reportError(error)
  return NextResponse.json({error: 'Internal server error'}, {status: 500})
}
