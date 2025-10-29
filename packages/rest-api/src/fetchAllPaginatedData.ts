import {Effect} from 'effect/index'

function fetchAllPaginatedData<R, E>({
  fetchEffectToRun,
  storeNextPageToken,
}: {
  fetchEffectToRun: (nextPageToken?: string) => Effect.Effect<
    {
      nextPageToken: string | null
      hasNext: boolean
      limit: number
      items: readonly R[]
    },
    E
  >
  storeNextPageToken?: (nextPageToken: string | undefined) => void
}): Effect.Effect<R[], E> {
  return Effect.gen(function* (_) {
    const allData: R[] = []
    let hasMore = true
    let nextPageToken: string | undefined

    while (hasMore) {
      const response = yield* _(fetchEffectToRun(nextPageToken))

      allData.push(...response.items)
      hasMore = response.hasNext
      nextPageToken = response.nextPageToken ?? undefined
    }

    if (storeNextPageToken) {
      storeNextPageToken(nextPageToken)
    }

    return allData
  })
}

export default fetchAllPaginatedData
