import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type OfferAdminId} from '@vexl-next/domain/src/general/offers'
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
import notEmpty from '../../../utils/notEmpty'
import {showDebugNotificationIfEnabled} from '../../../utils/notifications/showDebugNotificationIfEnabled'
import reportError from '../../../utils/reportError'
import {startMeasure} from '../../../utils/reportTime'
import {effectWithEnsuredBenchmark} from '../../ActionBenchmarks'
import {clubsWithMembersAtom} from '../../clubs/atom/clubsWithMembersAtom'
import {
  offersStateAtom,
  singleOfferByAdminIdAtom,
} from '../../marketplace/atoms/offersState'
import {OfferToConnectionsItems, type OfferToConnectionsItem} from '../domain'
import connectionStateAtom from './connectionStateAtom'

const BACKGROUND_TIME_LIMIT_MS = 25_000

const offerToConnectionsAtom = atomWithParsedMmkvStorage(
  'offer-to-connections',
  {
    offerToConnections: [],
  },
  OfferToConnectionsItems
)

export default offerToConnectionsAtom

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
  const adminIds = get(offersStateAtom)
    .offers.map((one) => one.ownershipInfo?.adminId)
    .filter(notEmpty)
  set(offerToConnectionsAtom, (old) => ({
    offerToConnections: old.offerToConnections.filter((one) =>
      adminIds.includes(one.adminId)
    ),
  }))
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

  set(offerToConnectionsAtom, (old) => ({
    ...old,
    offerToConnections: pipe(
      adminIdsWithSimmetricKey,
      Array.map(({adminId, simmetricKey}) =>
        pipe(
          Array.findFirst(
            old.offerToConnections,
            (one) => one.adminId === adminId
          ),
          Option.getOrElse(() => ({
            adminId,
            connections: {
              clubs: {},
              firstLevel: [],
              secondLevel: [],
            },
            symmetricKey: simmetricKey,
          }))
        )
      )
    ),
  }))
})

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

export const updateAndReencryptSingleOfferConnectionActionAtom = atom(
  null,
  (
    get,
    set,
    {
      adminId,
      stopProcessingAfter,
      onProgress,
    }: {
      adminId: OfferAdminId
      stopProcessingAfter?: UnixMilliseconds
      onProgress?: (status: OfferEncryptionProgress) => void
    }
  ) =>
    Effect.gen(function* (_) {
      const offerApi = get(apiAtom).offer

      const connectionState = get(connectionStateAtom)
      const oneOfferConnectionsAtom =
        createSingleOfferToConnectionsAtom(adminId)
      const oneOfferConnections = yield* _(get(oneOfferConnectionsAtom))

      const offer = get(singleOfferByAdminIdAtom(adminId))

      const clubIdsToEncryptFor = offer?.ownershipInfo?.intendedClubs

      const clubsData = get(clubsWithMembersAtom)
      const targetClubIdWithMembersArray = pipe(
        clubsData,
        Array.filter((one) =>
          Array.contains(clubIdsToEncryptFor ?? [], one.club.uuid)
        ),
        // Extract publicKeyV2 when available, otherwise publicKey
        Array.map(
          ({club, members}) =>
            [
              club.uuid,
              Array.map(members, (m) =>
                Option.isSome(m.publicKeyV2) ? m.publicKeyV2.value : m.publicKey
              ),
            ] as const
        ),
        Record.fromEntries
      )

      const intendedConnectionLevel =
        offer?.ownershipInfo?.intendedConnectionLevel ?? 'ALL'

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
        encryptionErrors,
        newConnections,
        timeLimitReachedErrors,
        removedConnections,
      } = yield* _(
        updatePrivateParts({
          currentConnections: oneOfferConnections.connections,
          targetConnections: {
            firstLevel: connectionState.firstLevel,
            secondLevel:
              intendedConnectionLevel === 'ALL'
                ? connectionState.secondLevel
                : [],
            clubs: targetClubIdWithMembersArray,
          },
          adminId: oneOfferConnections.adminId,
          symmetricKey: oneOfferConnections.symmetricKey,
          commonFriends: connectionState.commonFriends,
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
              (newConnections.secondLevel?.length ?? 0) +
              (pipe(newConnections.clubs ?? {}, Record.values, Array.flatten)
                .length ?? 0)
            }. Total connections skipped: ${String(
              timeLimitReachedErrors.length
            )}.`
          ),
          {timeLimitReachedErrors}
        )
      }

      set(oneOfferConnectionsAtom, (val) => ({
        ...val,
        connections: {
          firstLevel: subtractArrays(
            [...val.connections.firstLevel, ...newConnections.firstLevel],
            removedConnections
          ),
          secondLevel:
            intendedConnectionLevel === 'ALL'
              ? subtractArrays(
                  [
                    ...(val.connections.secondLevel ?? []),
                    ...(newConnections.secondLevel ?? []),
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
      }))
    })
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
      set(deleteOrphanRecordsActionAtom)
      set(ensureConnectionsForEveryOffer)

      const offerToConnectionsAtoms = get(offerToConnectionsAtomsAtom)

      return yield* _(
        offerToConnectionsAtoms,
        Array.map((oneOfferAtom, i) => {
          const adminId = get(oneOfferAtom).adminId
          return set(updateAndReencryptSingleOfferConnectionActionAtom, {
            adminId,
            onProgress: onProgres
              ? (progress) => {
                  onProgres({
                    offerI: i,
                    totalOffers: offerToConnectionsAtoms.length,
                    progress,
                  })
                }
              : undefined,
            stopProcessingAfter,
          }).pipe(
            Effect.zipRight(Effect.succeed({adminId, success: true})),
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
    })
)
