import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type ClubUuid} from '@vexl-next/domain/src/general/clubs'
import {type OfferAdminId} from '@vexl-next/domain/src/general/offers'
import {
  UnixMilliseconds,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import updatePrivateParts from '@vexl-next/resources-utils/src/offers/updatePrivateParts'
import {subtractArrays} from '@vexl-next/resources-utils/src/utils/array'
import {Array, Option, Record, Struct} from 'effect'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {splitAtom} from 'jotai/utils'
import {apiAtom} from '../../../api'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'
import notEmpty from '../../../utils/notEmpty'
import {showDebugNotificationIfEnabled} from '../../../utils/notifications/showDebugNotificationIfEnabled'
import reportError from '../../../utils/reportError'
import {startMeasure} from '../../../utils/reportTime'
import {clubsWithMembersAtom} from '../../clubs/atom/clubsWithMembersAtom'
import {
  offersStateAtom,
  singleOfferByAdminIdAtom,
} from '../../marketplace/atoms/offersState'
import {OfferToConnectionsItems, type OfferToConnectionsItem} from '../domain'
import connectionStateAtom from './connectionStateAtom'

const BACKGROUND_TIME_LIMIT_MS = 25_000

const offerToConnectionsAtom = atomWithParsedMmkvStorageE(
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

type ClubConnections = Record<ClubUuid, readonly PublicKeyPemBase64[]>
const processClubConnections = ({
  currentConnections,
  newConnections,
  removedConnections,
}: {
  currentConnections: ClubConnections
  newConnections: ClubConnections
  removedConnections: readonly PublicKeyPemBase64[]
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

export const updateAllOffersConnectionsActionAtom = atom(
  null,
  (
    get,
    set,
    {isInBackground}: {isInBackground?: boolean}
  ): T.Task<
    ReadonlyArray<{
      readonly adminId: OfferAdminId
      readonly success: boolean
    }>
  > => {
    const connectionState = get(connectionStateAtom)
    const api = get(apiAtom)
    const stopProcessingAfter: UnixMilliseconds | undefined = isInBackground
      ? UnixMilliseconds.parse(unixMillisecondsNow() + BACKGROUND_TIME_LIMIT_MS)
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
      "Update all offers' connections"
    )
    set(deleteOrphanRecordsActionAtom)
    set(ensureConnectionsForEveryOffer)

    const offerToConnectionsAtoms = get(offerToConnectionsAtomsAtom)

    return pipe(
      offerToConnectionsAtoms,
      A.mapWithIndex((i, oneOfferAtom) => {
        const oneOfferConections = get(oneOfferAtom)
        const offer = get(singleOfferByAdminIdAtom(oneOfferConections.adminId))

        const clubIdsToEncryptFor = offer?.ownershipInfo?.intendedClubs
        const {data: clubsData} = get(clubsWithMembersAtom)
        const targetClubIdWithMembersArray = pipe(
          clubsData,
          Array.filter((one) =>
            Array.contains(clubIdsToEncryptFor ?? [], one.club.uuid)
          ),
          Array.map(({club, members}) => [club.uuid, members] as const),
          Record.fromEntries
        )
        const intendedConnectionLevel =
          offer?.ownershipInfo?.intendedConnectionLevel ?? 'ALL'

        let endOneOfferUpdateMeasure: () => void = () => {}
        return pipe(
          TE.Do,
          TE.chainW(() => {
            endOneOfferUpdateMeasure = startMeasure(
              "Update one offer's connections"
            )
            return TE.Do
          }),
          TE.chainFirstEitherK(() => {
            if (
              !stopProcessingAfter ||
              unixMillisecondsNow() < stopProcessingAfter
            )
              return E.right('ok')
            return E.left({_tag: 'SkippedBecauseTimeLimitReached'} as const)
          }),
          TE.chainW(() =>
            effectToTaskEither(
              updatePrivateParts({
                currentConnections: oneOfferConections.connections,
                targetConnections: {
                  firstLevel: connectionState.firstLevel,
                  secondLevel:
                    intendedConnectionLevel === 'ALL'
                      ? connectionState.secondLevel
                      : [],
                  clubs: targetClubIdWithMembersArray,
                },
                adminId: oneOfferConections.adminId,
                symmetricKey: oneOfferConections.symmetricKey,
                commonFriends: connectionState.commonFriends,
                stopProcessingAfter,
                api: api.offer,
              })
            )
          ),
          TE.map((v) => {
            endOneOfferUpdateMeasure()
            return v
          }),
          TE.match(
            (error) => {
              if (error._tag === 'SkippedBecauseTimeLimitReached') {
                reportError(
                  'warn',
                  new Error(
                    `Skipped updating ${i + 1} / ${
                      offerToConnectionsAtoms.length
                    } offer connections due to time limit reached`
                  ),
                  {error}
                )
              }
              if (error._tag === 'NetworkError') {
                reportError(
                  'info',
                  new Error(
                    'Unable to update offer connections due to network error'
                  ),
                  {error}
                )
              }
              reportError(
                'warn',
                new Error('Unable to update offer connections'),
                {error}
              )
              return {
                adminId: oneOfferConections.adminId,
                success: false,
              }
            },
            ({
              encryptionErrors,
              newConnections,
              timeLimitReachedErrors,
              removedConnections,
            }) => {
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
                    `Offer connections: ${i + 1} / ${
                      offerToConnectionsAtoms.length
                    } did not update fully due to time limit reached. Total connections updated: ${
                      newConnections.firstLevel.length +
                      (newConnections.secondLevel?.length ?? 0) +
                      (pipe(
                        newConnections.clubs ?? {},
                        Record.values,
                        Array.flatten
                      ).length ?? 0)
                    }. Total connections skipped: ${String(
                      timeLimitReachedErrors.length
                    )}.`
                  ),
                  {timeLimitReachedErrors}
                )
              }

              set(oneOfferAtom, (val) => ({
                ...val,
                connections: {
                  firstLevel: subtractArrays(
                    [
                      ...val.connections.firstLevel,
                      ...newConnections.firstLevel,
                    ],
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
              return {
                adminId: oneOfferConections.adminId,
                success: true,
              }
            }
          ),
          T.map((res) => {
            return res
          })
        )
      }),
      T.sequenceSeqArray,
      T.map((res) => {
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

        return res
      })
    )
  }
)
