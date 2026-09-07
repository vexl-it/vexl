import * as Sentry from '@sentry/nextjs'
import {Effect, Schema, type Result} from 'effect'
import {NextResponse, type NextRequest} from 'next/server'
import {
  InvalidAdminTokenError,
  MissingAdminTokenError,
  validateAdminRequest,
} from './auth'

export const jsonOk = <A>(data: A, status = 200): NextResponse =>
  NextResponse.json(data, {status})

export const badRequest = (message: string): NextResponse =>
  NextResponse.json({error: message}, {status: 400})

export const notFound = (message: string): NextResponse =>
  NextResponse.json({error: message}, {status: 404})

export const noContent = (): NextResponse =>
  new NextResponse(null, {status: 204})

export const decodeJsonBody = async <S extends Schema.Decoder<unknown>>(
  request: NextRequest,
  schema: S
): Promise<Result.Result<S['Type'], Schema.SchemaError>> => {
  const body = await request.json()
  return Schema.decodeUnknownResult(schema)(body)
}

export const requireAdmin = async (
  request: NextRequest
): Promise<NextResponse | null> => {
  const result = await Effect.runPromise(
    Effect.result(validateAdminRequest(request))
  )

  if (result._tag === 'Success') return null

  if (
    result.failure instanceof MissingAdminTokenError ||
    result.failure instanceof InvalidAdminTokenError
  ) {
    return NextResponse.json({error: result.failure.message}, {status: 401})
  }

  throw new Error('Failed to validate admin token')
}

export const internalServerError = (error: unknown): NextResponse => {
  console.error('Backoffice slideshow API error:', error)
  Sentry.captureException(error)
  return NextResponse.json({error: 'Internal server error'}, {status: 500})
}
