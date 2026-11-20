import {accessError} from '@/src/server/access/errors'
import {requireSessionSection} from '@/src/server/access/session'
import {adminTokenConfig} from '@/src/server/config'
import {handleAccessRequest} from '@/src/server/http'
import {
  resolveProxyRequest,
  type ResolvedProxyRequest,
} from '@/src/server/proxyRules'
import {Array, Effect, Option, Redacted} from 'effect'
import {NextResponse, type NextRequest} from 'next/server'

export const runtime = 'nodejs'

const RESPONSE_HEADERS_TO_DROP = [
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'set-cookie',
]

const forwardedHeaders = (
  request: NextRequest,
  adminToken: Option.Option<string>
): Headers => {
  const headers = new Headers({
    'content-type': request.headers.get('content-type') ?? 'application/json',
  })
  const clientIp = request.headers.get('cf-connecting-ip')
  if (clientIp) headers.set('cf-connecting-ip', clientIp)
  if (Option.isSome(adminToken)) headers.set('x-admin-token', adminToken.value)
  return headers
}

const forward = async (
  request: NextRequest,
  {target, url}: ResolvedProxyRequest,
  adminToken: Option.Option<string>
): Promise<NextResponse> => {
  const startedAt = Date.now()
  const logContext = {method: request.method, path: url.pathname}
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'

  try {
    const backendResponse = await fetch(url, {
      method: request.method,
      headers: forwardedHeaders(request, adminToken),
      body: hasBody ? await request.text() : null,
      redirect: 'manual',
    })
    const logResult =
      backendResponse.status >= 500
        ? console.error
        : backendResponse.ok
          ? console.info
          : console.warn
    logResult('Backoffice proxy response', {
      ...logContext,
      target: target.baseUrl,
      status: backendResponse.status,
      durationMs: Date.now() - startedAt,
    })

    const headers = new Headers(backendResponse.headers)
    Array.forEach(RESPONSE_HEADERS_TO_DROP, (header) => {
      headers.delete(header)
    })
    return new NextResponse(await backendResponse.arrayBuffer(), {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers,
    })
  } catch (error) {
    console.error('Backoffice proxy request failed', {
      ...logContext,
      durationMs: Date.now() - startedAt,
      error,
    })
    return NextResponse.json({error: 'Proxy request failed'}, {status: 502})
  }
}

const proxyRequest = (request: NextRequest): Promise<NextResponse> =>
  handleAccessRequest(
    Effect.gen(function* (_) {
      const resolved = yield* _(
        resolveProxyRequest(request.method, request.nextUrl),
        Effect.mapError(() => accessError(404, 'Unknown proxy path'))
      )
      yield* _(requireSessionSection(request, resolved.section))
      const adminToken = resolved.target.sendsAdminToken
        ? Option.some(Redacted.value(yield* _(adminTokenConfig)))
        : Option.none()
      return yield* _(
        Effect.promise(() => forward(request, resolved, adminToken))
      )
    })
  )

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const DELETE = proxyRequest
