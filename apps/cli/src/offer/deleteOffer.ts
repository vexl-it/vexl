import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {getPrivateApiFromCredentialsJsonString} from '../api'
import {splitAndParse} from '../utils/splitAndParse'
import {OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'

export default function deleteOffer({
  adminIds,
  credentialsJson,
}: {
  adminIds: string
  credentialsJson: string
}) {
  return pipe(
    getPrivateApiFromCredentialsJsonString(credentialsJson),
    TE.fromEither,
    TE.chainW((api) =>
      pipe(
        adminIds,
        splitAndParse(OfferAdminId, /[,\n]/),
        TE.fromEither,
        TE.map((adminIds) => ({adminIds})),
        TE.chainW(api.offer.deleteOffer)
      )
    )
  )
}
