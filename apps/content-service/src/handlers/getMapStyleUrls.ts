import {HttpApiBuilder} from '@effect/platform/index'
import {type MapStyleUrlsResponse} from '@vexl-next/rest-api/src/services/content/contracts'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {darkMapStyleUrlConfig, lightMapStyleUrlConfig} from '../configs'

export const getMapStyleUrlsHandler = HttpApiBuilder.handler(
  ContentApiSpecification,
  'Map',
  'getMapStyleUrls',
  () =>
    Effect.gen(function* (_) {
      return {
        light: yield* _(lightMapStyleUrlConfig),
        dark: yield* _(darkMapStyleUrlConfig),
      } satisfies MapStyleUrlsResponse
    }).pipe(makeEndpointEffect)
)
