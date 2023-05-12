import {type OfferToConnectionsItem, OfferToConnectionsItems} from '../domain'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {splitAtom} from 'jotai/utils'
import {focusAtom} from 'jotai-optics'
import {atom} from 'jotai'
import * as T from 'fp-ts/Task'
import {type OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {privateApiAtom} from '../../../api'
import {startMeasure} from '../../../utils/reportTime'
import {pipe} from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import updatePrivateParts from '@vexl-next/resources-utils/dist/offers/updatePrivateParts'
import * as TE from 'fp-ts/TaskEither'
import reportError from '../../../utils/reportError'
import connectionStateAtom from './connectionStateAtom'

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

export const updateAllOffersConnectionsActionAtom = atom(
  null,
  (
    get,
    set
  ): T.Task<
    ReadonlyArray<{
      readonly adminId: OfferAdminId
      readonly success: boolean
    }>
  > => {
    const connectionState = get(connectionStateAtom)
    const api = get(privateApiAtom)

    console.info(
      `🦋 Updating offer connections. Total offers to update: ${
        get(offerToConnectionsAtomsAtom).length
      }`
    )
    const endUpdateOfferConnectionsMeasure = startMeasure(
      "Update all offers' connections"
    )

    return pipe(
      get(offerToConnectionsAtomsAtom),
      A.map((oneOfferAtom) => {
        const endSingleOfferMeasure = startMeasure(
          'One offer connections update'
        )
        const oneOffer = get(oneOfferAtom)
        return pipe(
          updatePrivateParts({
            currentConnections: oneOffer.connections,
            targetConnections: {
              firstLevel: connectionState.firstLevel,
              secondLevel: connectionState.secondLevel,
            },
            adminId: oneOffer.adminId,
            symmetricKey: oneOffer.symmetricKey,
            commonFriends: connectionState.commonFriends,
            api: api.offer,
          }),
          TE.match(
            (error) => {
              if (error._tag === 'NetworkError') {
                reportError(
                  'info',
                  'Unable to update offer connections due to network error',
                  error
                )
              }
              reportError('warn', 'Unable to update offer connections', error)
              return {
                adminId: oneOffer.adminId,
                success: false,
              }
            },
            ({encryptionErrors, newConnections}) => {
              if (encryptionErrors.length > 0) {
                reportError(
                  'error',
                  'Error while encrypting offer',
                  encryptionErrors
                )
              }
              set(oneOfferAtom, (val) => ({
                ...val,
                connections: newConnections,
              }))
              return {
                adminId: oneOffer.adminId,
                success: true,
              }
            }
          ),
          T.map((res) => {
            endSingleOfferMeasure()
            return res
          })
        )
      }),
      T.sequenceArray,
      T.map((res) => {
        endUpdateOfferConnectionsMeasure()
        return res
      })
    )
  }
)
