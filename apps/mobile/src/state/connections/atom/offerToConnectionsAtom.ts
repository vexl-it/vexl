import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {
  type IntendedConnectionLevel,
  type OfferAdminId,
} from '@vexl-next/domain/src/general/offers'
import {
  UnixMilliseconds,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type OfferEncryptionProgress} from '@vexl-next/resources-utils/src/offers/OfferEncryptionProgress'
import updatePrivateParts from '@vexl-next/resources-utils/src/offers/updatePrivateParts'
import {subtractArrays} from '@vexl-next/resources-utils/src/utils/array'
import {Array, Effect, Option, Record, Schema, Struct} from 'effect'
import {pipe} from 'fp-ts/function'
import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {splitAtom} from 'jotai/utils'
import {apiAtom} from '../../../api'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import getValueFromSetStateActionOfAtom from '../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {showDebugNotificationIfEnabled} from '../../../utils/notifications/showDebugNotificationIfEnabled'
import reportError from '../../../utils/reportError'
import {startMeasure} from '../../../utils/reportTime'
import {effectWithEnsuredBenchmark} from '../../ActionBenchmarks'
import {clubsWithMembersAtom} from '../../clubs/atom/clubsWithMembersAtom'
import {
  offersStateAtom,
  singleOfferByAdminIdAtom,
} from '../../marketplace/atoms/offersState'
import {
  OfferToConnectionsItems,
  type ConnectionsState,
  type OfferToConnectionsItem,
} from '../domain'
import {getConnectionsToRefresh} from '../utils/getChangedConnectionPublicKeys'
import {getOfferTargetConnections} from '../utils/getOfferTargetConnections'
import connectionStateAtom, {
  fetchConnectionsActionAtom,
} from './connectionStateAtom'
import {offersReencryptionStartedAtAtom} from './offersReencryptionStartedAtAtom'

const BACKGROUND_TIME_LIMIT_MS = 25_000

// Full syncs and manual edits must not upload older payloads or clear each
// other's pending refreshes. Keep the lock scoped to the Jotai store.
const connectionUpdatesSemaphoreAtom = atom(() => Effect.unsafeMakeSemaphore(1))

const offerToConnectionsAtom = atomWithParsedMmkvStorage(
  'offer-to-connections',
  {
    offerToConnections: [],
  },
  OfferToConnectionsItems
)

export default offerToConnectionsAtom

const setOfferConnectionRecordsIfChangedAtom = atom(
  null,
  (get, set, records: OfferToConnectionsItem[]) => {
    const current = get(offerToConnectionsAtom)
    if (
      records.length === current.offerToConnections.length &&
      Array.every(
        records,
        (record, i) => record === current.offerToConnections[i]
      )
    )
      return

    set(offerToConnectionsAtom, {...current, offerToConnections: records})
  }
)

const offerToConnectionsAtomsAtom = splitAtom(
  focusAtom(offerToConnectionsAtom, (p) => p.prop('offerToConnections'))
)

export const deleteOfferToConnectionsAtom = atom(
  null,
  (get, set, adminIdToDelete: OfferAdminId) => {
    set(offerToConnectionsAtom, (old) => ({
      ...old,
      offerToConnections: old.offerToConnections.filter(
        (one) => one.adminId !== adminIdToDelete
      ),
    }))
  }
)

export const deleteClubForAllConnectionsActionAtom = atom(
  null,
  (get, set, clubUuidToDelete: ClubUuid) => {
    const offerToConnections = get(offerToConnectionsAtom).offerToConnections
    const offerToClubConnections = pipe(
      offerToConnections,
      Array.filterMap((one) => {
        return Option.all({
          connections: Record.get(one.connections.clubs, clubUuidToDelete).pipe(
            Option.filter(Array.isNonEmptyReadonlyArray)
          ),
          adminId: Option.some(one.adminId),
        })
      })
    )

    set(offerToConnectionsAtom, (old) => ({
      ...old,
      offerToConnections: Array.map(old.offerToConnections, (one) => ({
        ...one,
        connections: {
          ...one.connections,
          clubs: Struct.omit(one.connections.clubs, clubUuidToDelete),
        },
      })),
    }))
    return offerToClubConnections
  }
)

export const createSingleOfferToConnectionsAtom = (
  adminId: OfferAdminId
): WritableAtom<
  Option.Option<OfferToConnectionsItem>,
  [SetStateAction<OfferToConnectionsItem>],
  void
> => {
  const toReturn = atom(
    (get) =>
      Array.findFirst(
        get(offerToConnectionsAtom).offerToConnections,
        (one) => one.adminId === adminId
      ),
    (get, set, newValueAction: SetStateAction<OfferToConnectionsItem>) => {
      set(offerToConnectionsAtom, (prevState) => {
        const prevConnectionIndexO = Array.findFirstIndex(
          prevState.offerToConnections,
          (one) => one.adminId === adminId
        )
        const prevConnectionO = Array.get(
          prevState.offerToConnections,
          Option.getOrElse(prevConnectionIndexO, () => -1)
        )
        if (
          Option.isNone(prevConnectionO) ||
          Option.isNone(prevConnectionIndexO)
        )
          return prevState

        const newValue = getValueFromSetStateActionOfAtom(newValueAction)(
          () => prevConnectionO.value
        )
        return {
          ...prevState,
          offerToConnections: Array.replace(
            prevState.offerToConnections,
            prevConnectionIndexO.value,
            newValue
          ),
        }
      })
    }
  )
  return toReturn
}
export const upsertOfferToConnectionsActionAtom = atom<
  null,
  [OfferToConnectionsItem],
  unknown
>(null, (get, set, newValue) => {
  set(offerToConnectionsAtom, (previousValue) => ({
    offerToConnections: [
      ...previousValue.offerToConnections.filter(
        (one) => one.adminId !== newValue.adminId
      ),
      newValue,
    ],
  }))
})

export const deleteOrphanRecordsActionAtom = atom(null, (get, set) => {
  const adminIds = new Set(
    pipe(
      get(offersStateAtom).offers,
      Array.filterMap((one) => Option.fromNullable(one.ownershipInfo?.adminId))
    )
  )
  set(
    setOfferConnectionRecordsIfChangedAtom,
    Array.filter(get(offerToConnectionsAtom).offerToConnections, (one) =>
      adminIds.has(one.adminId)
    )
  )
})

export const ensureConnectionsForEveryOffer = atom(null, (get, set) => {
  const adminIdsWithSimmetricKey = pipe(
    get(offersStateAtom).offers,
    Array.filterMap((one) =>
      Option.all({
        adminId: Option.fromNullable(one.ownershipInfo?.adminId),
        simmetricKey: Option.some(one.offerInfo.privatePart.symmetricKey),
      })
    )
  )

  const current = get(offerToConnectionsAtom).offerToConnections
  set(
    setOfferConnectionRecordsIfChangedAtom,
    pipe(
      adminIdsWithSimmetricKey,
      Array.map(({adminId, simmetricKey}) =>
        pipe(
          Array.findFirst(current, (one) => one.adminId === adminId),
          Option.getOrElse(() => ({
            adminId,
            pendingConnectionsToRefresh: [],
            connections: {
              clubs: {},
              firstLevel: [],
              secondLevel: [],
            },
            symmetricKey: simmetricKey,
          }))
        )
      )
    )
  )
})

// Number of records `updateAndReencryptAllOffersConnectionsActionAtom` will
// process — the pass keeps exactly one record per own offer. Read up front by
// flows that need to size the offers part of an aggregated progress bar.
export const offersToReencryptCountAtom = atom((get) =>
  pipe(
    get(offersStateAtom).offers,
    Array.filter((one) => !!one.ownershipInfo?.adminId),
    Array.length
  )
)

type ClubConnections = Record<
  ClubUuid,
  ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2>
>
const processClubConnections = ({
  currentConnections,
  newConnections,
  removedConnections,
}: {
  currentConnections: ClubConnections
  newConnections: ClubConnections
  removedConnections: ReadonlyArray<PublicKeyPemBase64 | PublicKeyV2>
}): ClubConnections => {
  const allClubsUuids = Array.dedupe([
    ...Record.keys(currentConnections),
    ...Record.keys(newConnections),
  ])

  return pipe(
    allClubsUuids,
    Array.map((clubUuid) => {
      const newConnectionsForClub = newConnections[clubUuid] ?? []
      const currentConnectionsForClub = currentConnections[clubUuid] ?? []

      const finalConnections = pipe(
        Array.dedupe([...newConnectionsForClub, ...currentConnectionsForClub]),
        Array.difference(removedConnections)
      )

      return [clubUuid, finalConnections] as const
    }),
    Record.fromEntries
  )
}

interface UpdateSingleOfferConnectionParams {
  adminId: OfferAdminId
  intendedClubs?: readonly ClubUuid[]
  intendedConnectionLevel?: IntendedConnectionLevel
  stopProcessingAfter?: UnixMilliseconds
  onProgress?: (status: OfferEncryptionProgress) => void
}

/**
 * Queues changed existing recipients for every offer before advancing the
 * shared graph. Must run under connectionUpdatesSemaphoreAtom, including
 * when only one offer is being updated. A failed fetch keeps pending work.
 */
const fetchAndQueueConnectionsActionAtom = atom(null, (get, set) =>
  Effect.gen(function* (_) {
    const previous = get(connectionStateAtom)
    const fetched = yield* _(set(fetchConnectionsActionAtom), Effect.option)

    set(deleteOrphanRecordsActionAtom)
    set(ensureConnectionsForEveryOffer)
    if (Option.isNone(fetched)) return previous

    const changedKeys = getConnectionsToRefresh(previous, fetched.value)
    const records = Array.map(
      get(offerToConnectionsAtom).offerToConnections,
      (one) => {
        const recipients = new Set([
          ...one.connections.firstLevel,
          ...one.connections.secondLevel,
        ])
        const pendingConnectionsToRefresh = Array.fromIterable(
          new Set([
            ...one.pendingConnectionsToRefresh,
            ...Array.filter(changedKeys, (key) => recipients.has(key)),
          ])
        )
        if (
          pendingConnectionsToRefresh.length ===
            one.pendingConnectionsToRefresh.length &&
          Array.every(
            pendingConnectionsToRefresh,
            (key, i) => key === one.pendingConnectionsToRefresh[i]
          )
        )
          return one
        return {...one, pendingConnectionsToRefresh}
      }
    )
    // A changed graph always writes, so queues left in memory by an earlier
    // failed write are retried before the baseline advances.
    if (Array.isNonEmptyArray(changedKeys))
      set(offerToConnectionsAtom, (old) => ({
        ...old,
        offerToConnections: records,
      }))
    else set(setOfferConnectionRecordsIfChangedAtom, records)

    // If persisting the queues fails, keep the previous baseline so a restart
    // can rediscover the work. Uploads can still use the fresh graph in memory.
    if (offerToConnectionsAtom.flushNow()) {
      set(connectionStateAtom, fetched.value)
      connectionStateAtom.flushNow()
    }
    return fetched.value
  })
)

/**
 * Uploads new/removed private parts for a single offer and returns an updater
 * that applies the resulting connection changes to the locally stored
 * `OfferToConnectionsItem`. Persisting the returned update is left to the
 * caller so batch flows can coalesce all offers into a single storage write.
 */
const computeSingleOfferConnectionUpdateActionAtom = atom(
  null,
  (
    get,
    set,
    {
      adminId,
      intendedClubs,
      intendedConnectionLevel,
      stopProcessingAfter,
      onProgress,
      connectionState,
    }: UpdateSingleOfferConnectionParams & {
      connectionState: ConnectionsState
    }
  ) =>
    Effect.gen(function* (_) {
      const offerApi = get(apiAtom).offer

      const oneOfferConnectionsAtom =
        createSingleOfferToConnectionsAtom(adminId)
      const oneOfferConnections = yield* _(get(oneOfferConnectionsAtom))
      const connectionsToRefresh =
        oneOfferConnections.pendingConnectionsToRefresh

      const offer = get(singleOfferByAdminIdAtom(adminId))

      const {connectionLevel, targetConnections} = getOfferTargetConnections({
        offer,
        connectionState,
        clubs: get(clubsWithMembersAtom),
        intendedClubs,
        intendedConnectionLevel,
      })

      if (
        !!stopProcessingAfter &&
        unixMillisecondsNow() > stopProcessingAfter
      ) {
        return yield* _(
          Effect.fail({_tag: 'SkippedBecauseTimeLimitReached' as const})
        )
      }

      const endOneOfferUpdateMeasure = startMeasure(
        'Update one offer connections'
      )
      const {
        updateSuccess,
        encryptionErrors,
        newConnections,
        timeLimitReachedErrors,
        removedConnections,
      } = yield* _(
        updatePrivateParts({
          currentConnections: oneOfferConnections.connections,
          connectionsToRefresh,
          targetConnections,
          adminId: oneOfferConnections.adminId,
          symmetricKey: oneOfferConnections.symmetricKey,
          commonFriends: connectionState.commonFriends,
          verifiedFriends: connectionState.verifiedFriends,
          stopProcessingAfter,
          onProgress,
          api: offerApi,
        }),
        Effect.ensuring(Effect.sync(() => endOneOfferUpdateMeasure()))
      )

      if (encryptionErrors.length > 0) {
        reportError(
          'error',
          new Error('Error while encrypting new connections for offer'),
          {encryptionErrors}
        )
      }

      if (timeLimitReachedErrors.length > 0) {
        reportError(
          'warn',
          new Error(
            `Offer (${offer?.offerInfo.offerId ?? 'unknonw'}) did not update fully due to time limit reached. Total connections updated: ${
              newConnections.firstLevel.length +
              newConnections.secondLevel.length +
              (pipe(newConnections.clubs ?? {}, Record.values, Array.flatten)
                .length ?? 0)
            }. Total connections skipped: ${String(
              timeLimitReachedErrors.length
            )}.`
          ),
          {timeLimitReachedErrors}
        )
      }

      const success = updateSuccess && !Array.isNonEmptyArray(encryptionErrors)
      return {
        updateSuccess: success,
        applyConnectionsUpdate: (
          val: OfferToConnectionsItem
        ): OfferToConnectionsItem => ({
          ...val,
          pendingConnectionsToRefresh: success
            ? []
            : val.pendingConnectionsToRefresh,
          connections: {
            firstLevel: subtractArrays(
              [...val.connections.firstLevel, ...newConnections.firstLevel],
              removedConnections
            ),
            secondLevel:
              connectionLevel === 'ALL'
                ? subtractArrays(
                    [
                      ...val.connections.secondLevel,
                      ...newConnections.secondLevel,
                    ],
                    removedConnections
                  )
                : [],
            clubs: processClubConnections({
              currentConnections: val.connections.clubs ?? {},
              newConnections: newConnections.clubs ?? {},
              removedConnections,
            }),
          },
        }),
      }
    })
)

export const updateAndReencryptSingleOfferConnectionActionAtom = atom(
  null,
  (get, set, params: UpdateSingleOfferConnectionParams) =>
    Effect.gen(function* (_) {
      const connectionState = yield* _(set(fetchAndQueueConnectionsActionAtom))
      const {applyConnectionsUpdate} = yield* _(
        set(computeSingleOfferConnectionUpdateActionAtom, {
          ...params,
          connectionState,
        })
      )
      set(
        createSingleOfferToConnectionsAtom(params.adminId),
        applyConnectionsUpdate
      )
      offerToConnectionsAtom.flushNow()
    }).pipe(get(connectionUpdatesSemaphoreAtom).withPermits(1))
)

export const updateAndReencryptAllOffersConnectionsActionAtom = atom(
  null,
  (
    get,
    set,
    {
      isInBackground,
      onProgres,
    }: {
      isInBackground?: boolean
      onProgres?: (args: {
        offerI: number
        totalOffers: number
        progress: OfferEncryptionProgress
      }) => void
    }
  ): Effect.Effect<
    ReadonlyArray<{
      readonly adminId: OfferAdminId
      readonly success: boolean
    }>
  > =>
    Effect.gen(function* (_) {
      const connectionState = yield* _(set(fetchAndQueueConnectionsActionAtom))
      const stopProcessingAfter: UnixMilliseconds | undefined = isInBackground
        ? Schema.decodeSync(UnixMilliseconds)(
            unixMillisecondsNow() + BACKGROUND_TIME_LIMIT_MS
          )
        : undefined

      console.info(
        `🦋 Updating offer connections. Total offers to update: ${
          get(offerToConnectionsAtomsAtom).length
        }. ${
          stopProcessingAfter
            ? `Stop processing after: ${stopProcessingAfter}`
            : ''
        }`
      )
      const endUpdateOfferConnectionsMeasure = startMeasure(
        'Update all offers connections'
      )
      const offerToConnectionsAtoms = get(offerToConnectionsAtomsAtom)
      let hasStartedEncryption = false

      // Per-offer results are accumulated in memory and persisted in chunks
      // (each write re-encodes and re-writes the entire storage blob, so
      // writing once per offer is prohibitively expensive, while a single
      // end-of-run write would lose every already-uploaded offer's local
      // record if the process is hard-killed mid-run). The final flush runs
      // via `Effect.ensuring` so updates that succeeded are persisted even
      // on partial failure or interruption.
      const PERSIST_CONNECTION_UPDATES_CHUNK_SIZE = 10
      const pendingConnectionUpdates = new Map<
        OfferAdminId,
        (val: OfferToConnectionsItem) => OfferToConnectionsItem
      >()
      const persistPendingConnectionUpdates = (): void => {
        if (pendingConnectionUpdates.size === 0) return
        set(offerToConnectionsAtom, (old) => ({
          ...old,
          offerToConnections: Array.map(old.offerToConnections, (one) => {
            const applyConnectionsUpdate = pendingConnectionUpdates.get(
              one.adminId
            )
            return applyConnectionsUpdate ? applyConnectionsUpdate(one) : one
          }),
        }))
        // The updaters are not idempotent — never apply a flushed one again.
        pendingConnectionUpdates.clear()
      }

      return yield* _(
        offerToConnectionsAtoms,
        Array.map((oneOfferAtom, i) => {
          const adminId = get(oneOfferAtom).adminId
          return set(computeSingleOfferConnectionUpdateActionAtom, {
            adminId,
            connectionState,
            onProgress: (progress) => {
              if (
                !hasStartedEncryption &&
                progress.type === 'ENCRYPTING_PRIVATE_PAYLOADS'
              ) {
                hasStartedEncryption = true
                set(offersReencryptionStartedAtAtom, Date.now())
              }
              onProgres?.({
                offerI: i,
                totalOffers: offerToConnectionsAtoms.length,
                progress,
              })
            },
            stopProcessingAfter,
          }).pipe(
            Effect.map(({updateSuccess, applyConnectionsUpdate}) => {
              pendingConnectionUpdates.set(adminId, applyConnectionsUpdate)
              if (
                pendingConnectionUpdates.size >=
                PERSIST_CONNECTION_UPDATES_CHUNK_SIZE
              )
                persistPendingConnectionUpdates()
              return {adminId, success: updateSuccess}
            }),
            Effect.catchAll((e) =>
              Effect.sync(() => {
                if (e._tag === 'SkippedBecauseTimeLimitReached') {
                  reportError(
                    'warn',
                    new Error(
                      `Skipped updating ${i + 1} / ${
                        offerToConnectionsAtoms.length
                      } offer connections due to time limit reached`
                    ),
                    {e}
                  )
                } else {
                  reportError(
                    'warn',
                    new Error('Unable to update offer connections'),
                    {e}
                  )
                }

                return {adminId, success: false}
              })
            )
          )
        }),
        Effect.all,
        Effect.ensuring(
          Effect.sync(() => {
            persistPendingConnectionUpdates()
            // The atom's own MMKV write is deferred behind an idle callback
            // and coalesced. By here the server has been mutated for every
            // processed offer, so a kill before that deferred flush runs would
            // drop the whole run's local connection records — leaving orphaned
            // server private parts that the next diff-based sync never removes
            // (current === target, so nothing is deleted). Force one synchronous
            // durable write to bound that window to the sync loop itself.
            offerToConnectionsAtom.flushNow()
          })
        ),
        Effect.tap((res) =>
          Effect.sync(() => {
            const timePretty = endUpdateOfferConnectionsMeasure()
            const timeLimitReached =
              stopProcessingAfter && unixMillisecondsNow() > stopProcessingAfter

            void showDebugNotificationIfEnabled({
              title: 'Offer connections updated.',
              subtitle: 'updateAllOffersConnectionsActionAtom',
              body: `${
                timeLimitReached
                  ? 'Encryption took too long and time limit was reached.'
                  : ''
              }.Total offers updated: ${res.length}. Success:  ${
                res.filter((one) => one.success).length
              }. Error: ${
                res.filter((one) => !one.success).length
              }. Took: ${timePretty} sec`,
            })
          })
        ),
        effectWithEnsuredBenchmark('Update and reencrypt all offers')
      )
    }).pipe(
      Effect.ensuring(
        Effect.sync(() => {
          set(offersReencryptionStartedAtAtom, null)
        })
      ),
      get(connectionUpdatesSemaphoreAtom).withPermits(1)
    )
)
