import {type NextRequest, NextResponse} from 'next/server'

const API_BACKEND_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:3003'

async function proxyRequest(request: NextRequest, method: string) {
  try {
    // Get the path from the URL
    const path = request.nextUrl.pathname.replace('/api/proxy/', '')

    // Build the backend URL
    const backendUrl = new URL(`${path}`, API_BACKEND_URL)

    // Copy over all query params from the original request (including adminToken)
    request.nextUrl.searchParams.forEach((value, key) => {
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

    console.log(`Proxying ${method} request to:`, backendUrl.toString())

    // Prepare headers to forward
    const headersToForward: Record<string, string> = {
      'Content-Type': request.headers.get('content-type') ?? 'application/json',
    }

    // Forward cf-connecting-ip header if present (Cloudflare client IP)
    const cfConnectingIp = request.headers.get('cf-connecting-ip')
    if (cfConnectingIp) {
      headersToForward['cf-connecting-ip'] = cfConnectingIp
    }

    // Forward the request to the backend
    const backendResponse = await fetch(backendUrl.toString(), {
      method,
      headers: headersToForward,
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
  } catch (error) {
    console.error('Proxy error:', error)
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
