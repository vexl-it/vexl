import {type BlogsArticlesResponse} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect, Option} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../api'

export const blogsStateAtom = atom<{
  loading: boolean
  data: Option.Option<BlogsArticlesResponse>
  error: Option.Option<unknown>
}>({
  loading: false,
  data: Option.none(),
  error: Option.none(),
})

export const loadBlogsActionAtom = atom(null, async (get, set) => {
  await Effect.gen(function* (_) {
    const api = get(apiAtom)
    set(blogsStateAtom, (prev) => ({
      ...prev,
      loading: true,
      error: Option.none(),
    }))

    yield* _(
      api.content.getBlogArticles(),
      Effect.match({
        onFailure: (e) => {
          set(blogsStateAtom, (prev) => ({
            ...prev,
            loading: false,
            error: Option.some(e),
          }))
        },
        onSuccess: (data) => {
          set(blogsStateAtom, (prev) => ({
            ...prev,
            loading: false,
            data: Option.some(data),
            error: Option.none(),
          }))
        },
      })
    )
  }).pipe(Effect.runPromise)
})
