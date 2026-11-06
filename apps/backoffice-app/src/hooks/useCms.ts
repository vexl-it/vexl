import {getAdminToken} from '@/src/services/adminTokenService'
import {cmsErrorMessage, uploadCmsImage} from '@/src/services/cms/api'
import {type AdminTokenHeaders} from '@/src/services/cms/resources'
import {
  makeCmsAdminClient,
  type CmsAdminClient,
} from '@/src/services/contentAdminApi'
import {Effect, Either} from 'effect'
import {useRouter} from 'next/navigation'
import {useCallback, useState} from 'react'

const useAdminToken = (): (() => string) => {
  const router = useRouter()
  return useCallback(() => {
    const adminToken = getAdminToken()
    if (adminToken) return adminToken

    router.push('/login')
    throw new Error('Sign in first.')
  }, [router])
}

/** Runs a content-service CMS call and rejects with a readable message. */
export function useCms() {
  const requireToken = useAdminToken()

  return useCallback(
    async <A, E>(
      call: (
        client: CmsAdminClient,
        headers: AdminTokenHeaders
      ) => Effect.Effect<A, E>
    ): Promise<A> => {
      const headers = {'x-admin-token': requireToken()}
      const result = await Effect.runPromise(
        makeCmsAdminClient().pipe(
          Effect.flatMap((client) => call(client, headers)),
          Effect.either
        )
      )
      if (Either.isLeft(result)) throw new Error(cmsErrorMessage(result.left))
      return result.right
    },
    [requireToken]
  )
}

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
