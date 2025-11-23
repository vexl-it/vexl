import {type NextRequest, NextResponse} from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    const presignedUrl = request.headers.get('x-presigned-url')
    const contentType = request.headers.get('content-type')

    if (!presignedUrl) {
      return NextResponse.json({error: 'Missing presigned URL'}, {status: 400})
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

    return NextResponse.json({success: true}, {status: 200})
  } catch (error) {
    console.error('Error proxying S3 upload:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {status: 500}
    )
  }
}
