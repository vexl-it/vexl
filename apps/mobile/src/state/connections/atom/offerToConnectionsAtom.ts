import {type OfferAdminId} from '@vexl-next/domain/src/general/offers'
import {
  UnixMilliseconds,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import updatePrivateParts from '@vexl-next/resources-utils/src/offers/updatePrivateParts'
import {subtractArrays} from '@vexl-next/resources-utils/src/utils/array'
import * as A from 'fp-ts/Array'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {splitAtom} from 'jotai/utils'
import {apiAtom} from '../../../api'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import notEmpty from '../../../utils/notEmpty'
import {showDebugNotificationIfEnabled} from '../../../utils/notifications/showDebugNotificationIfEnabled'
import reportError from '../../../utils/reportError'
import {startMeasure} from '../../../utils/reportTime'
import {myStoredClubsAtom} from '../../contacts/atom/clubsStore'
import {
  offersStateAtom,
  singleOfferByAdminIdAtom,
} from '../../marketplace/atoms/offersState'
import getClubConnectionsForUuids from '../../marketplace/utils/getClubsConnectionsForUuids'
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
      offerToConnections: old.offerToConnections.filter(
        (one) => one.adminId !== adminIdToDelete
      ),
    }))
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
    const myStoredClubs = get(myStoredClubsAtom)
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

    const offerToConnectionsAtoms = get(offerToConnectionsAtomsAtom)

    return pipe(
      offerToConnectionsAtoms,
      A.mapWithIndex((i, oneOfferAtom) => {
        const oneOfferConections = get(oneOfferAtom)
        const offer = get(singleOfferByAdminIdAtom(oneOfferConections.adminId))
        const clubsUuids = offer?.offerInfo.publicPart.clubsUuids
          ? [...offer.offerInfo.publicPart.clubsUuids]
          : []
        const targetClubConnections = getClubConnectionsForUuids({
          clubsUuids,
          myStoredClubs,
        })
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
                  clubs: targetClubConnections,
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
                      (newConnections.clubs?.length ?? 0)
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
                      : undefined,
                  clubs:
                    clubsUuids.length > 0
                      ? subtractArrays(
                          [
                            ...(val.connections.clubs ?? []),
                            ...(newConnections.clubs ?? []),
                          ],
                          removedConnections
                        )
                      : undefined,
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
