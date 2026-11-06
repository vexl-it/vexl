import * as Sentry from '@sentry/nextjs'
import {Array, Effect, Schema, type Either, type ParseResult} from 'effect'
import {NextResponse, type NextRequest} from 'next/server'
import {type BackofficeRole} from '../services/adminTokenService'
import {
  InvalidAdminTokenError,
  MissingAdminTokenError,
  resolveRequestRole,
} from './auth'

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

const unauthorized = (message: string): NextResponse =>
  NextResponse.json({error: message}, {status: 401})

/** The caller's role, or the 401 response to return. */
export const authenticate = async (
  request: NextRequest
): Promise<BackofficeRole | NextResponse> => {
  const result = await Effect.runPromise(
    Effect.either(resolveRequestRole(request))
  )

  if (result._tag === 'Right') return result.right

  if (
    result.left instanceof MissingAdminTokenError ||
    result.left instanceof InvalidAdminTokenError
  ) {
    return unauthorized(result.left.message)
  }

  if (result.left instanceof Error) throw result.left

  throw new Error('Failed to validate admin token')
}

const requireRole = async (
  request: NextRequest,
  allowedRoles: readonly BackofficeRole[]
): Promise<NextResponse | null> => {
  const role = await authenticate(request)
  if (role instanceof NextResponse) return role

  return Array.contains(allowedRoles, role)
    ? null
    : unauthorized('This token is not allowed to do this')
}

export const requireAdmin = (
  request: NextRequest
): Promise<NextResponse | null> => requireRole(request, ['admin'])

/** Blog posts and events: admins and content editors. */
export const requireCmsEditor = (
  request: NextRequest
): Promise<NextResponse | null> =>
  requireRole(request, ['admin', 'contentEditor'])

export const reportError = (error: unknown): void => {
  console.error('Backoffice API error:', error)
  Sentry.captureException(error)
}

export const internalServerError = (error: unknown): NextResponse => {
  reportError(error)
  return NextResponse.json({error: 'Internal server error'}, {status: 500})
}
