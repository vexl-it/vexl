import {Effect, Schema, type Either, type ParseResult} from 'effect'
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

export const decodeJsonBody = async <S extends Schema.Schema.AnyNoContext>(
  request: NextRequest,
  schema: S
): Promise<Either.Either<Schema.Schema.Type<S>, ParseResult.ParseError>> => {
  const body = await request.json()
  return Schema.decodeUnknownEither(schema)(body)
}

export const requireAdmin = async (
  request: NextRequest
): Promise<NextResponse | null> => {
  const result = await Effect.runPromise(
    Effect.either(validateAdminRequest(request))
  )

  if (result._tag === 'Right') return null

  if (
    result.left instanceof MissingAdminTokenError ||
    result.left instanceof InvalidAdminTokenError
  ) {
    return NextResponse.json({error: result.left.message}, {status: 401})
  }

  if (result.left instanceof Error) throw result.left

  throw new Error('Failed to validate admin token')
}

export const internalServerError = (error: unknown): NextResponse => {
  console.error('Backoffice slideshow API error:', error)
  return NextResponse.json({error: 'Internal server error'}, {status: 500})
}
