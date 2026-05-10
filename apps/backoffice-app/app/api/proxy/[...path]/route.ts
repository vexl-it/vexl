import {type NextRequest, NextResponse} from 'next/server'

const CONTACT_API_INTERNAL_URL =
  process.env.CONTACT_API_INTERNAL_URL ??
  process.env.API_INTERNAL_URL ??
  'http://localhost:3002'
const CONTENT_API_INTERNAL_URL =
  process.env.CONTENT_API_INTERNAL_URL ?? 'http://localhost:3009'

const getBackendUrl = (path: string): string =>
  path.startsWith('content/')
    ? CONTENT_API_INTERNAL_URL
    : CONTACT_API_INTERNAL_URL

const MAX_ERROR_BODY_LOG_LENGTH = 4000

const getRequestId = (request: NextRequest): string =>
  request.headers.get('x-request-id') ??
  request.headers.get('cf-ray') ??
  crypto.randomUUID()

const getContentLength = (body: BodyInit | null): number | null => {
  if (body === null) return null
  if (typeof body === 'string') return body.length
  return null
}

const truncateForLog = (value: string): string =>
  value.length > MAX_ERROR_BODY_LOG_LENGTH
    ? `${value.slice(0, MAX_ERROR_BODY_LOG_LENGTH)}...[truncated]`
    : value

async function proxyRequest(request: NextRequest, method: string) {
  const startedAt = Date.now()
  const requestId = getRequestId(request)

  try {
    // Get the path from the URL
    const path = request.nextUrl.pathname.replace('/api/proxy/', '')
    const backendBaseUrl = getBackendUrl(path)

    // Build the backend URL
    const backendUrl = new URL(`${path}`, backendBaseUrl)

    // Copy non-admin query params from the original request.
    request.nextUrl.searchParams.forEach((value, key) => {
      if (key === 'adminToken' || key === 'token') return
      backendUrl.searchParams.set(key, value)
    })

    // Get the request body if it exists
    let body: BodyInit | null = null
    if (method !== 'GET' && method !== 'HEAD') {
      const contentType = request.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        body = JSON.stringify(await request.json())
      } else {
        body = await request.text()
      }
    }

    console.info('Backoffice proxy request', {
      requestId,
      method,
      path,
      backendBaseUrl,
      backendUrl: backendUrl.toString(),
      contentType: request.headers.get('content-type'),
      contentLength: getContentLength(body),
      hasAdminToken: request.headers.has('x-admin-token'),
    })

    // Prepare headers to forward
    const headersToForward: Record<string, string> = {
      'Content-Type': request.headers.get('content-type') ?? 'application/json',
    }

    // Forward cf-connecting-ip header if present (Cloudflare client IP)
    const cfConnectingIp = request.headers.get('cf-connecting-ip')
    if (cfConnectingIp) {
      headersToForward['cf-connecting-ip'] = cfConnectingIp
    }

    const adminToken = request.headers.get('x-admin-token')
    if (adminToken) {
      headersToForward['x-admin-token'] = adminToken
    }

    // Forward the request to the backend
    const backendResponse = await fetch(backendUrl.toString(), {
      method,
      headers: headersToForward,
      body,
    })

    // Get response data
    const responseData = await backendResponse.text()
    const durationMs = Date.now() - startedAt

    if (backendResponse.ok) {
      console.info('Backoffice proxy response', {
        requestId,
        method,
        path,
        status: backendResponse.status,
        durationMs,
      })
    } else {
      console.error('Backoffice proxy backend error', {
        requestId,
        method,
        path,
        backendUrl: backendUrl.toString(),
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        durationMs,
        responseContentType: backendResponse.headers.get('content-type'),
        responseBody: truncateForLog(responseData),
      })
    }

    // Create the response with the same status and headers
    const response = new NextResponse(responseData, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
    })

    // Copy relevant headers
    backendResponse.headers.forEach((value, key) => {
      if (
        key !== 'content-encoding' &&
        key !== 'transfer-encoding' &&
        key !== 'connection'
      ) {
        response.headers.set(key, value)
      }
    })

    return response
  } catch (error) {
    console.error('Backoffice proxy request failed', {
      requestId,
      method,
      durationMs: Date.now() - startedAt,
      error,
    })
    return NextResponse.json(
      {
        error: 'Proxy request failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500}
    )
  }
}

export async function GET(request: NextRequest) {
  return await proxyRequest(request, 'GET')
}

export async function POST(request: NextRequest) {
  return await proxyRequest(request, 'POST')
}

export async function PUT(request: NextRequest) {
  return await proxyRequest(request, 'PUT')
}

export async function DELETE(request: NextRequest) {
  return await proxyRequest(request, 'DELETE')
}

export async function PATCH(request: NextRequest) {
  return await proxyRequest(request, 'PATCH')
}
