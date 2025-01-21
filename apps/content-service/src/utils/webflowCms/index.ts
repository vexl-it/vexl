import axios from 'axios'
import {Context, Effect, Layer, Schema} from 'effect'
import {type ParseError} from 'effect/ParseResult'
import {
  WebflowEventsCollectionIdConfig,
  WebflowSpeakersCollectionIdConfig,
  WebflowTokenConfig,
} from '../../configs'
import {
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
      const webflowToken = yield* _(WebflowTokenConfig)
      const webflowEventsCollectionId = yield* _(
        WebflowEventsCollectionIdConfig
      )
      const webflowSpeakersCollectionId = yield* _(
        WebflowSpeakersCollectionIdConfig
      )

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
      } satisfies WebflowCmsOperations

      return toReturn
    })
  )
}
