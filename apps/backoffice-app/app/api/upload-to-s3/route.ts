import {
  badRequest,
  internalServerError,
  jsonOk,
  requireAdmin,
} from '@/src/server/slideshows/http'
import {type NextRequest, NextResponse} from 'next/server'

export const runtime = 'nodejs'

export async function PUT(request: NextRequest) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const presignedUrl = request.headers.get('x-presigned-url')
    const contentType = request.headers.get('content-type')

    if (!presignedUrl) {
      return badRequest('Missing presigned URL')
    }

    // Get the file data from the request
    const fileData = await request.arrayBuffer()

    // Upload to S3 using the presigned URL
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: fileData,
      headers: {
        'Content-Type': contentType ?? 'application/octet-stream',
      },
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      return NextResponse.json(
        {error: 'Failed to upload to S3', details: errorText},
        {status: uploadResponse.status}
      )
    }

    return jsonOk({success: true})
  } catch (error) {
    return internalServerError(error)
  }
}
