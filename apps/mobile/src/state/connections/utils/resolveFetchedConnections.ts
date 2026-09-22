import {type UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, Option} from 'effect'
import {type ConnectionsState} from '../domain'

/**
 * A graph fetched by the caller before taking a sync lock may be older than
 * the baseline a concurrent run stored meanwhile — only accept it when it is
 * newer, otherwise fetch again under the lock. `undefined` means the caller
 * did not fetch, `Option.none()` means its fetch failed.
 */
export function resolveFetchedConnections<E>({
  fetchedConnections,
  baselineLastUpdate,
  fetch,
}: {
  fetchedConnections: Option.Option<ConnectionsState> | undefined
  baselineLastUpdate: UnixMilliseconds
  fetch: () => Effect.Effect<ConnectionsState, E>
}): Effect.Effect<Option.Option<ConnectionsState>> {
  if (
    fetchedConnections === undefined ||
    Option.exists(
      fetchedConnections,
      (one) => one.lastUpdate <= baselineLastUpdate
    )
  )
    return Effect.option(fetch())
  return Effect.succeed(fetchedConnections)
}
