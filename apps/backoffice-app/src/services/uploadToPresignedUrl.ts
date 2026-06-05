interface UploadToPresignedUrlInput {
  readonly presignedUrl: string
  readonly contentType: string
  readonly file: File
}

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
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Upload failed before S3 returned a response. Verify that the S3 bucket CORS policy allows PUT requests from this backoffice origin.'
      )
    }

    throw error
  }

  if (!response.ok) {
    throw new Error(await readUploadResponseError(response))
  }
}
