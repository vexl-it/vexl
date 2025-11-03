import {HttpApi} from '@effect/platform/index'
import {MaxExpectedDailyCall} from '@vexl-next/rest-api/src/MaxExpectedDailyCountAnnotation'
import {Context, MutableHashMap, Option} from 'effect/index'

export const normalizePath = (path: string): string => {
  // Remove query string and fragment
  let clean = path.split(/[?#]/)[0] ?? ''

  // Ensure it starts with a slash
  if (!clean.startsWith('/')) clean = '/' + clean

  // Collapse multiple slashes into one
  clean = clean.replace(/\/{2,}/g, '/')

  // Remove trailing slash, unless it's just "/"
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1)
  }

  return clean
}

type RouteToKeyResult =
  | {
      _tag: 'hasLimit'
      limit: number
    }
  | {_tag: 'noRouteFound'}
  | {_tag: 'noLimitSpecified'}

export const buildRateLimitingLimitsForEndpoints = (
  spec: HttpApi.HttpApi<any, any, any, any>,
  rateLimitPerIpMultiplier: number
): {
  getEndpointLimit: (method: string, url: string) => RouteToKeyResult
} => {
  const routeToKey = (method: string, url: string): string =>
    `${method.toUpperCase()} ${normalizePath(url)}`

  const routeToMaxSpecifiedDailyCount: MutableHashMap.MutableHashMap<
    string,
    RouteToKeyResult
  > = MutableHashMap.empty()

  // fill the routeToMaxSpecifiedDailyCount from the api specification

  HttpApi.reflect(spec, {
    onGroup: () => {},
    onEndpoint: ({endpoint}) => {
      const url = endpoint.path
      const method = endpoint.method
      const key = routeToKey(method, url)
      Context.getOption(endpoint.annotations, MaxExpectedDailyCall).pipe(
        Option.match({
          onNone: () => {
            MutableHashMap.set(routeToMaxSpecifiedDailyCount, key, {
              _tag: 'noLimitSpecified',
            })
          },
          onSome: (MaxExpectedDailyCall) => {
            MutableHashMap.set(routeToMaxSpecifiedDailyCount, key, {
              _tag: 'hasLimit',
              limit: MaxExpectedDailyCall * rateLimitPerIpMultiplier,
            })
          },
        })
      )
    },
  })

  return {
    getEndpointLimit: (method: string, url: string): RouteToKeyResult =>
      MutableHashMap.get(
        routeToMaxSpecifiedDailyCount,
        routeToKey(method, url)
      ).pipe(
        Option.getOrElse(() => {
          return {_tag: 'noRouteFound' as const}
        })
      ),
  }
}
