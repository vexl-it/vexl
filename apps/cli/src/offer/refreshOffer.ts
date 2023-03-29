import {OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {getPrivateApiFromCredentialsJsonString} from '../api'
import {splitAndParse} from '../utils/splitAndParse'
import {stringifyToPrettyJson} from '@vexl-next/resources-utils/dist/utils/parsing'

export default function refreshOffer({
  adminIds,
  credentialsJsonString,
}: {
  adminIds: string
  credentialsJsonString: string
}) {
  return pipe(
    getPrivateApiFromCredentialsJsonString(credentialsJsonString),
    TE.fromEither,
    TE.chainW((api) =>
      pipe(
        adminIds,
        splitAndParse(OfferAdminId, /[,\n]/),
        TE.fromEither,
        TE.map((adminIds) => ({adminIds})),
        TE.chainW(api.offer.refreshOffer)
      )
    ),
    TE.chainEitherKW(stringifyToPrettyJson)
  )
}
