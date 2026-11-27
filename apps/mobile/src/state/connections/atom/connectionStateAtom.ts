import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {type ChatUserIdentity} from '@vexl-next/domain/src/general/messaging'
import {
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {FETCH_CONNECTIONS_PAGE_SIZE} from '@vexl-next/resources-utils/src/offers/utils/fetchContactsForOffer'
import fetchAllPaginatedData from '@vexl-next/rest-api/src/fetchAllPaginatedData'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {Array, Effect, HashMap, Number, Schema} from 'effect'
import {pipe} from 'fp-ts/function'
import {atom, type Atom} from 'jotai'
import {apiAtom} from '../../../api'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import deduplicate from '../../../utils/deduplicate'
import {showDebugNotificationIfEnabled} from '../../../utils/notifications/showDebugNotificationIfEnabled'
import reportError from '../../../utils/reportError'
import {effectWithEnsuredBenchmark} from '../../ActionBenchmarks'
import {clubsWithMembersAtom} from '../../clubs/atom/clubsWithMembersAtom'
import {getClubReach} from '../../clubs/utils'
import {importedContactsAtom} from '../../contacts/atom/contactsStore'
import {ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom} from '../../contacts/atom/ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom'
import {ConnectionsState} from '../domain'
import {persistedReachRequiresConnectionsAtom} from './reachNumberWithoutClubsConnectionsMmkvAtom'

const connectionStateAtom = atomWithParsedMmkvStorage(
  'connectionsStateV2',
  {
    lastUpdate: UnixMilliseconds0,
    firstLevel: [],
    secondLevel: [],
    commonFriends: HashMap.empty(),
    verifiedFriends: HashMap.empty(),
  },
  ConnectionsState
)

export default connectionStateAtom

export class UnexpectedReachDropError extends Schema.TaggedError<UnexpectedReachDropError>()(
  'UnexpectedReachDropError',
  {}
) {}

export const unexpectedReachDropDetectedAtom = atom(false)

function firstAndSecondLevelConnections<T>(
  firstLevel: readonly T[],
  secondLevel: readonly T[]
): T[] {
  return deduplicate([...firstLevel, ...secondLevel])
}

function fetchContacts(
  level: 'FIRST' | 'SECOND',
  api: ContactApi
): Effect.Effect<
  Array<PublicKeyPemBase64 | PublicKeyV2>,
  Effect.Effect.Error<ReturnType<ContactApi['fetchMyContactsPaginated']>>
> {
  return fetchAllPaginatedData({
    fetchEffectToRun: (nextPageToken) =>
      api.fetchMyContactsPaginated({
        level,
        limit: FETCH_CONNECTIONS_PAGE_SIZE,
        nextPageToken,
      }),
  })
}

export const fetchConnectionsActionAtom = atom(
  null,
  (
    get,
    set,
    {acceptEmptyGraph = false}: {readonly acceptEmptyGraph?: boolean} = {}
  ) => {
    return Effect.gen(function* (_) {
      const api = get(apiAtom)

      console.log('🦋 Refreshing connections state')
      const updateStarted = unixMillisecondsNow()
      const syncedContactHashes = new Set(
        Array.map(
          get(importedContactsAtom),
          (contact) => contact.computedValues.hash
        )
      )

      const {firstLevel, secondLevel} = yield* _(
        Effect.all(
          {
            firstLevel: fetchContacts('FIRST', api.contact),
            secondLevel: fetchContacts('SECOND', api.contact),
          },
          {concurrency: 'unbounded'}
        )
      )

      const publicKeys = firstAndSecondLevelConnections(firstLevel, secondLevel)
      if (
        !Array.isNonEmptyArray(publicKeys) &&
        !acceptEmptyGraph &&
        get(persistedReachRequiresConnectionsAtom)
      ) {
        set(unexpectedReachDropDetectedAtom, true)
        return yield* _(Effect.fail(new UnexpectedReachDropError()))
      }

      const serverToClientHashesToHashedPhoneNumbersMap = yield* _(
        set(ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom)
      )

      const commonConnectionsData = yield* _(
        fetchAllPaginatedData({
          fetchEffectToRun: (nextPageToken) =>
            api.contact.fetchCommonConnectionsPaginated({
              publicKeys,
              limit: FETCH_CONNECTIONS_PAGE_SIZE,
              nextPageToken,
            }),
        })
      )

      const commonFriends = pipe(
        commonConnectionsData,
        Array.map(
          (one) =>
            [
              one.publicKey,
              Array.filterMap(one.common.hashes, (hash) =>
                HashMap.get(serverToClientHashesToHashedPhoneNumbersMap, hash)
              ),
            ] as const
        ),
        HashMap.fromIterable
      )

      const verifiedFriends = pipe(
        commonConnectionsData,
        Array.map(
          (one) =>
            [
              one.publicKey,
              Array.filterMap(one.common.verifiedHashes, (hash) =>
                HashMap.get(serverToClientHashesToHashedPhoneNumbersMap, hash)
              ),
            ] as const
        ),
        HashMap.fromIterable
      )

      const lastUpdate = updateStarted

      void showDebugNotificationIfEnabled({
        title: 'Connections synced',
        subtitle: 'fetchConnectionsActionAtom',
        body: `Finished syncing connections in ${unixMillisecondsNow() - updateStarted} ms`,
      })

      const connections: ConnectionsState = {
        firstLevel,
        secondLevel,
        commonFriends,
        verifiedFriends,
        lastUpdate,
        syncedContactHashes,
      }
      return connections
    }).pipe(
      Effect.tapError((e) =>
        Effect.sync(() => {
          void showDebugNotificationIfEnabled({
            title: 'Error while syncing connections',
            subtitle: 'fetchConnectionsActionAtom',
            body: e._tag,
          })
          reportError(
            'warn',
            new Error('Unable to refresh connections state'),
            {e}
          )
        })
      ),
      effectWithEnsuredBenchmark('Sync connections')
    )
  }
)

export const fistAndSecondLevelConnectionsReachAtom = atom((get) => {
  const {firstLevel, secondLevel} = get(connectionStateAtom)

  return firstAndSecondLevelConnections(firstLevel, secondLevel).length
})

export const clubsConnectionsReachAtom = atom((get) => {
  return pipe(get(clubsWithMembersAtom), Array.map(getClubReach), Number.sumAll)
})

export const reachNumberAtom = atom((get) => {
  const fistAndSecondLevelConnectionsReach = get(
    fistAndSecondLevelConnectionsReachAtom
  )
  const clubsConnectionsReach = get(clubsConnectionsReachAtom)

  return fistAndSecondLevelConnectionsReach + clubsConnectionsReach
})

export function createFriendLevelInfoAtom(
  otherSide: ChatUserIdentity
): Atom<Array<'FIRST_DEGREE' | 'SECOND_DEGREE' | 'CLUB'>> {
  return atom((get) => {
    const isFirst = get(connectionStateAtom).firstLevel.includes(
      otherSide.publicKey
    )
    const isSecond = get(connectionStateAtom).secondLevel.includes(
      otherSide.publicKey
    )

    const toReturn: Array<'FIRST_DEGREE' | 'SECOND_DEGREE' | 'CLUB'> = []
    if (isFirst) toReturn.push('FIRST_DEGREE' as const)
    if (isSecond) toReturn.push('SECOND_DEGREE' as const)
    if (otherSide.clubsIds && otherSide.clubsIds.length > 0)
      toReturn.push('CLUB' as const)

    return toReturn
  })
}
