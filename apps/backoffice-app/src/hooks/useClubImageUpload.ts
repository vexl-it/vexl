import {useRunEffect} from '@/src/hooks/useRunEffect'
import {getAdminToken} from '@/src/services/adminTokenService'
import {makeClubsAdminClient} from '@/src/services/clubsAdminApi'
import {Array, Option, pipe, String} from 'effect'
import {useRouter} from 'next/navigation'
import {useCallback, useState} from 'react'

type FileExtension = 'png' | 'jpg' | 'jpeg'
const RESOURCES_BASE_URL = 'https://resources.vexl.it/clubs/'

interface UseClubImageUploadResult {
  selectedFile: File | null
  previewUrl: string | null
  uploading: boolean
  uploadProgress: number
  uploadedImageUrl: string | null
  error: string | null
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploadImage: () => Promise<void>
  resetUpload: () => void
}

export function useClubImageUpload(): UseClubImageUploadResult {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const runEffect = useRunEffect()
  const router = useRouter()

  const getFileExtension = (file: File): FileExtension => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'jpg') return 'jpg'
    if (ext === 'jpeg') return 'jpeg'
    if (ext === 'png') return 'png'
    return 'jpg'
  }

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0]
      if (!file) return

      const validTypes = ['image/png', 'image/jpg', 'image/jpeg']
      if (!validTypes.includes(file.type)) {
        setError('Please select a PNG or JPEG image')
        return
      }

      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError(null)
      setUploadedImageUrl(null)
    },
    []
  )

  const uploadImage = useCallback(async (): Promise<void> => {
    if (!selectedFile) {
      setError('Please select a file')
      return
    }

    const adminToken = getAdminToken()
    if (!adminToken) {
      router.push('/login')
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const fileExtension = getFileExtension(selectedFile)

      setUploadProgress(25)
      const client = await runEffect(makeClubsAdminClient())
      const result = await runEffect(
        client.requestClubImageUpload({
          urlParams: {adminToken},
          payload: {fileExtension},
        })
      )

      setUploadProgress(50)
      // Upload through proxy to avoid CORS issues
      const uploadResponse = await fetch('/api/upload-to-s3', {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
          'x-presigned-url': result.presignedUrl,
        },
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error ?? 'Failed to upload image to S3')
      }

      setUploadProgress(100)
      const imageUrl = pipe(
        result.presignedUrl,
        String.split('/'),
        Array.last,
        Option.map((imageName) => `${RESOURCES_BASE_URL}${imageName}`),
        Option.getOrElse(() => '')
      )
      setUploadedImageUrl(imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }, [selectedFile, runEffect, router])

  const resetUpload = useCallback((): void => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadedImageUrl(null)
    setError(null)
    setUploadProgress(0)
  }, [])

  return {
    selectedFile,
    previewUrl,
    uploading,
    uploadProgress,
    uploadedImageUrl,
    error,
    handleFileSelect,
    uploadImage,
    resetUpload,
  }
}
