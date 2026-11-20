import {uploadToPresignedUrl} from '@/src/services/uploadToPresignedUrl'
import {type ImageExtension} from '@vexl-next/rest-api/src/services/contact/contracts'
import {useState} from 'react'
import {useClubsApi} from './useClubsApi'

const RESOURCES_BASE_URL = 'https://resources.vexl.it/'
const MAX_SIZE_BYTES = 10 * 1024 * 1024

const EXTENSION_BY_TYPE: Readonly<Record<string, ImageExtension>> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
}

export const ACCEPTED_CLUB_IMAGE_TYPES =
  Object.keys(EXTENSION_BY_TYPE).join(',')

/** Uploads a club image and resolves with its public URL, or null on failure. */
export function useClubImageUpload() {
  const clubsApi = useClubsApi()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File): Promise<string | null> => {
    const fileExtension = EXTENSION_BY_TYPE[file.type]
    if (!fileExtension) {
      setError('Choose a PNG or JPEG image.')
      return null
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('The image is larger than 10 MB.')
      return null
    }

    setUploading(true)
    setError(null)
    try {
      const {presignedUrl, contentType, s3Key} = await clubsApi((client) =>
        client.requestClubImageUpload({payload: {fileExtension}})
      )
      await uploadToPresignedUrl({presignedUrl, contentType, file})
      return `${RESOURCES_BASE_URL}${s3Key}`
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Failed to upload the image.'
      )
      return null
    } finally {
      setUploading(false)
    }
  }

  return {uploading, error, upload}
}
