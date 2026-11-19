import {
  getAdminToken,
  type AdminTokenHeaders,
} from '@/src/services/adminTokenService'
import {Effect, Either} from 'effect'
import {useRouter} from 'next/navigation'
import {useCallback} from 'react'

export const useAdminToken = (): (() => string) => {
  const router = useRouter()
  return useCallback(() => {
    const adminToken = getAdminToken()
    if (adminToken) return adminToken

    router.push('/login')
    throw new Error('Sign in first.')
  }, [router])
}

/**
 * Runs an admin API call with the stored admin token and rejects with a
 * readable message. Pass module-level functions, they are hook dependencies.
 */
export function useAdminApi<Client>(
  makeClient: () => Effect.Effect<Client>,
  errorMessage: (error: unknown) => string
) {
  const requireToken = useAdminToken()

  return useCallback(
    async <A, E>(
      call: (client: Client, headers: AdminTokenHeaders) => Effect.Effect<A, E>
    ): Promise<A> => {
      const headers = {'x-admin-token': requireToken()}
      const result = await Effect.runPromise(
        makeClient().pipe(
          Effect.flatMap((client) => call(client, headers)),
          Effect.either
        )
      )
      if (Either.isLeft(result)) throw new Error(errorMessage(result.left))
      return result.right
    },
    [requireToken, makeClient, errorMessage]
  )
}
