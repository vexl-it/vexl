import {cmsErrorMessage, uploadCmsImage} from '@/src/services/cms/api'
import {makeCmsAdminClient} from '@/src/services/contentAdminApi'
import {useCallback, useState} from 'react'
import {useAdminApi, useAdminToken} from './useAdminApi'

/** Runs a content-service CMS call and rejects with a readable message. */
export const useCms = () => useAdminApi(makeCmsAdminClient, cmsErrorMessage)

/** `uploading` stays true while any upload started here is in flight. */
export function useCmsImageUpload(): {
  readonly uploadImage: (file: File) => Promise<string>
  readonly uploading: boolean
} {
  const requireToken = useAdminToken()
  const [pendingCount, setPendingCount] = useState(0)
  const uploadImage = useCallback(
    async (file: File) => {
      setPendingCount((count) => count + 1)
      try {
        return await uploadCmsImage(requireToken(), file)
      } finally {
        setPendingCount((count) => count - 1)
      }
    },
    [requireToken]
  )
  return {uploadImage, uploading: pendingCount > 0}
}
