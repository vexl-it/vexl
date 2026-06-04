import {
  badRequest,
  internalServerError,
  jsonOk,
  requireAdmin,
} from '@/src/server/slideshows/http'
import {type NextRequest, NextResponse} from 'next/server'

export const runtime = 'nodejs'

const CLUB_IMAGE_PATH_REGEX =
  /(^|\/)clubs\/[0-9a-f-]+\.jpe?g$|(^|\/)clubs\/[0-9a-f-]+\.png$/i

const SLIDESHOW_ASSET_PATH_REGEX =
  /(^|\/)backoffice\/slideshows\/[0-9a-f-]+\/[0-9a-f-]+\.(jpe?g|png|webp|mp4|webm)$/i

const getConfiguredS3Endpoint = (): URL | undefined => {
  const configuredEndpoint = process.env.S3_ENDPOINT

  if (!configuredEndpoint) return undefined

  try {
    return new URL(configuredEndpoint)
  } catch {
    return undefined
  }
}

const isAllowedS3Host = (
  url: URL,
  configuredEndpoint: URL | undefined
): boolean => {
  const hostname = url.hostname
  const host = hostname.toLowerCase()

  return (
    host === 's3.amazonaws.com' ||
    (host.endsWith('.amazonaws.com') &&
      (host.startsWith('s3.') ||
        host.includes('.s3.') ||
        host.includes('.s3-'))) ||
    (configuredEndpoint !== undefined &&
      url.protocol === configuredEndpoint.protocol &&
      host === configuredEndpoint.hostname.toLowerCase())
  )
}

const isAllowedS3Path = (pathname: string): boolean => {
  return (
    CLUB_IMAGE_PATH_REGEX.test(pathname) ||
    SLIDESHOW_ASSET_PATH_REGEX.test(pathname)
  )
}

const isAllowedS3Protocol = (
  url: URL,
  configuredEndpoint: URL | undefined
): boolean =>
  url.protocol === 'https:' ||
  (configuredEndpoint !== undefined &&
    url.protocol === configuredEndpoint.protocol &&
    url.hostname.toLowerCase() === configuredEndpoint.hostname.toLowerCase())

const parsePresignedS3Url = (presignedUrl: string): URL | undefined => {
  try {
    const url = new URL(presignedUrl)
    const configuredEndpoint = getConfiguredS3Endpoint()

    if (
      !isAllowedS3Protocol(url, configuredEndpoint) ||
      !isAllowedS3Host(url, configuredEndpoint) ||
      !isAllowedS3Path(url.pathname) ||
      !url.searchParams.has('X-Amz-Credential') ||
      !url.searchParams.has('X-Amz-Signature')
    ) {
      return undefined
    }

    return url
  } catch {
    return undefined
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authError = await requireAdmin(request)
    if (authError) return authError

    const presignedUrl = request.headers.get('x-presigned-url')
    const contentType = request.headers.get('content-type')

    if (!presignedUrl) {
      return badRequest('Missing presigned URL')
    }

    const s3Url = parsePresignedS3Url(presignedUrl)

    if (!s3Url) {
      return NextResponse.json({error: 'Invalid presigned URL'}, {status: 400})
    }

    // Get the file data from the request
    const fileData = await request.arrayBuffer()

    // Upload to S3 using the presigned URL
    const uploadResponse = await fetch(s3Url.toString(), {
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
