import axios from 'axios'
import {Context, Effect, Layer, Schema} from 'effect'
import {type ParseError} from 'effect/ParseResult'
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
    WebflowFetchError | ParseError
  >
  fetchSpeakers: () => Effect.Effect<
    WebflowSpeakersResponse,
    WebflowFetchError | ParseError
  >
  fetchBlogs: () => Effect.Effect<
    WebflowBlogsResponse,
    WebflowFetchError | ParseError
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

export class WebflowCmsService extends Context.Tag('WebflowCmsService')<
  WebflowCmsService,
  WebflowCmsOperations
>() {
  static readonly Live = Layer.effect(
    WebflowCmsService,
    Effect.gen(function* (_) {
      const webflowToken = yield* _(webflowTokenConfig)
      const webflowEventsCollectionId = yield* _(
        webflowEventsCollectionIdConfig
      )
      const webflowSpeakersCollectionId = yield* _(
        webflowSpeakersCollectionIdConfig
      )
      const webflowBlogCollectionId = yield* _(webflowBlogCollectionIdConfig)

      const toReturn = {
        fetchEvents: () =>
          listCollectionItems({
            collectionId: webflowEventsCollectionId,
            token: webflowToken,
          }).pipe(Effect.flatMap(Schema.decodeUnknown(WebflowEventsResponse))),
        fetchSpeakers: () =>
          listCollectionItems({
            collectionId: webflowSpeakersCollectionId,
            token: webflowToken,
          }).pipe(
            Effect.flatMap(Schema.decodeUnknown(WebflowSpeakersResponse))
          ),
        fetchBlogs: () =>
          listCollectionItems({
            collectionId: webflowBlogCollectionId,
            token: webflowToken,
          }).pipe(Effect.flatMap(Schema.decodeUnknown(WebflowBlogsResponse))),
      } satisfies WebflowCmsOperations

      return toReturn
    })
  )
}
