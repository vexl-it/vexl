import {Effect, Either} from 'effect'
import {useCallback} from 'react'

/**
 * Runs an admin API call and rejects with a readable message. Pass
 * module-level functions, they are hook dependencies.
 */
export function useAdminApi<Client>(
  makeClient: () => Effect.Effect<Client>,
  errorMessage: (error: unknown) => string
) {
  return useCallback(
    async <A, E>(call: (client: Client) => Effect.Effect<A, E>): Promise<A> => {
      const result = await Effect.runPromise(
        makeClient().pipe(Effect.flatMap(call), Effect.either)
      )
      if (Either.isLeft(result)) throw new Error(errorMessage(result.left))
      return result.right
    },
    [makeClient, errorMessage]
  )
}
