interface UploadToPresignedUrlInput {
  readonly presignedUrl: string
  readonly contentType: string
  readonly file: File
}

const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000

const readUploadResponseError = async (response: Response): Promise<string> => {
  try {
    const body = await response.text()
    return body.length > 0 ? body : response.statusText
  } catch {
    return response.statusText
  }
}

export const uploadToPresignedUrl = async ({
  presignedUrl,
  contentType,
  file,
}: UploadToPresignedUrlInput): Promise<void> => {
  let response: Response

  try {
    response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType,
      },
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error('Upload timed out before S3 returned a response.')
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Upload was aborted before S3 returned a response.')
    }

    if (error instanceof TypeError) {
      throw new Error(
        'Upload failed before a response was received from S3. This can be caused by a network error, DNS failure, or a missing CORS policy on the bucket.'
      )
    }

    throw error
  }

  if (!response.ok) {
    throw new Error(await readUploadResponseError(response))
  }
}
