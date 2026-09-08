import axios from 'axios'
import {Context, Effect, Layer, Schema} from 'effect'
import {type SchemaError} from 'effect/Schema'
import {
  webflowBlogCollectionIdConfig,
  webflowEventsCollectionIdConfig,
  webflowSpeakersCollectionIdConfig,
  webflowTokenConfig,
} from '../../configs'
import {
  WebflowBlogsResponse,
  WebflowEventsResponse,
  WebflowFetchError,
  WebflowSpeakersResponse,
} from './domain'

export interface WebflowCmsOperations {
  fetchEvents: () => Effect.Effect<
    WebflowEventsResponse,
    WebflowFetchError | SchemaError
  >
  fetchSpeakers: () => Effect.Effect<
    WebflowSpeakersResponse,
    WebflowFetchError | SchemaError
  >
  fetchBlogs: () => Effect.Effect<
    WebflowBlogsResponse,
    WebflowFetchError | SchemaError
  >
}

function listCollectionItems({
  collectionId,
  token,
}: {
  collectionId: string
  token: string
}): Effect.Effect<unknown, WebflowFetchError> {
  const url = `https://api.webflow.com/v2/collections/${collectionId}/items/live`
  const bearer = `Bearer ${token}`

  return Effect.tryPromise({
    try: async () =>
      await axios.get(url, {
        headers: {
          Authorization: bearer,
        },
      }),
    catch: (e) =>
      new WebflowFetchError({
        cause: e,
        message: 'Failed to fetch items from Webflow',
      }),
  }).pipe(Effect.map((one) => one.data))
}

export class WebflowCmsService extends Context.Service<
  WebflowCmsService,
  WebflowCmsOperations
>()('WebflowCmsService') {
  static readonly Live = Layer.effect(
    WebflowCmsService,
    Effect.gen(function* () {
      const webflowToken = yield* webflowTokenConfig
      const webflowEventsCollectionId = yield* webflowEventsCollectionIdConfig
      const webflowSpeakersCollectionId =
        yield* webflowSpeakersCollectionIdConfig
      const webflowBlogCollectionId = yield* webflowBlogCollectionIdConfig

      const toReturn = {
        fetchEvents: () =>
          listCollectionItems({
            collectionId: webflowEventsCollectionId,
            token: webflowToken,
          }).pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(WebflowEventsResponse))
          ),
        fetchSpeakers: () =>
          listCollectionItems({
            collectionId: webflowSpeakersCollectionId,
            token: webflowToken,
          }).pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(WebflowSpeakersResponse))
          ),
        fetchBlogs: () =>
          listCollectionItems({
            collectionId: webflowBlogCollectionId,
            token: webflowToken,
          }).pipe(
            Effect.flatMap(Schema.decodeUnknownEffect(WebflowBlogsResponse))
          ),
      } satisfies WebflowCmsOperations

      return toReturn
    })
  )
}
