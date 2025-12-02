import {type NextRequest, NextResponse} from 'next/server'

const API_BACKEND_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:3003'

async function proxyRequest(request: NextRequest, method: string) {
  // Get the path from the URL
  const path = request.nextUrl.pathname.replace('/api/proxy/', '')

  // Build the backend URL
  const backendUrl = new URL(`${path}`, API_BACKEND_URL)

  // Copy over all query params from the original request (including adminToken)
  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value)
  })

  // Log the incoming request (redact sensitive params)
  const logUrl = new URL(backendUrl.toString())
  if (logUrl.searchParams.has('adminToken')) {
    logUrl.searchParams.set('adminToken', '[REDACTED]')
  }
  console.log(`[Proxy] ${method} ${logUrl.toString()}`)

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

  // Forward the request to the backend
  const backendResponse = await fetch(backendUrl.toString(), {
    method,
    headers: {
      'Content-Type': request.headers.get('content-type') ?? 'application/json',
    },
    body,
  })

  // Get response data
  const responseData = await backendResponse.text()

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
