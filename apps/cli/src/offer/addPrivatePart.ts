import {getPrivateApiFromCredentialsJsonString} from '../api'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {type OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {parseCredentialsJson} from '../utils/auth'
import {addPrivatePartsToOffer} from '@vexl-next/resources-utils/dist/offers/addPrivatePartToOffer'
import {z} from 'zod'
import {OfferPrivatePayloadToEncrypt} from '@vexl-next/resources-utils/dist/offers/utils/offerPrivatePayload'
import {
  safeParse,
  stringifyToPrettyJson,
} from '@vexl-next/resources-utils/dist/utils/parsing'

const PrivateParts = z.array(OfferPrivatePayloadToEncrypt)

export default function addPrivatePart({
  adminId,
  privatePartsJson,
  credentialsJson,
}: {
  adminId: OfferAdminId
  privatePartsJson: string
  credentialsJson: string
}) {
  return pipe(
    TE.Do,
    TE.bindW('credentials', () =>
      TE.fromEither(parseCredentialsJson(credentialsJson))
    ),
    TE.bindW('api', () =>
      pipe(
        credentialsJson,
        getPrivateApiFromCredentialsJsonString,
        TE.fromEither
      )
    ),
    TE.bindW('privateParts', () =>
      pipe(privatePartsJson, safeParse(PrivateParts), TE.fromEither)
    ),
    TE.chainW(({api, credentials, privateParts}) =>
      addPrivatePartsToOffer({
        privateParts,
        api: api.offer,
        adminId,
      })
    ),
    TE.chainEitherKW(stringifyToPrettyJson)
  )
}
