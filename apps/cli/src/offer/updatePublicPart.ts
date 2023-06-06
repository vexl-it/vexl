import {pipe} from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {getPrivateApi} from '../api'
import {type OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {
  OfferPublicPart,
  type SymmetricKey,
} from '@vexl-next/domain/dist/general/offers'
import {parseCredentialsJson} from '../utils/auth'
import {
  parseJson,
  safeParse,
  stringifyToPrettyJson,
} from '@vexl-next/resources-utils/dist/utils/parsing'
import updateOffer from '@vexl-next/resources-utils/dist/offers/updateOffer'

export default function updatePublicPart({
  publicPayloadJson,
  ownerCredentialsJson,
  symmetricKey,
  adminId,
}: {
  adminId: OfferAdminId
  publicPayloadJson: string
  symmetricKey: SymmetricKey
  ownerCredentialsJson: string
}) {
  return pipe(
    E.of({}),
    E.bindW('ownerCredentials', () =>
      parseCredentialsJson(ownerCredentialsJson)
    ),
    E.bindW('api', ({ownerCredentials}) =>
      E.right(getPrivateApi(ownerCredentials))
    ),
    TE.fromEither,
    TE.bindW('publicPayload', () =>
      pipe(
        E.of(publicPayloadJson),
        E.chainW(parseJson),
        E.chainW(safeParse(OfferPublicPart)),
        TE.fromEither
      )
    ),
    TE.chainW(({ownerCredentials, publicPayload, api}) =>
      updateOffer({
        offerApi: api.offer,
        adminId,
        publicPayload,
        symmetricKey,
        ownerKeypair: ownerCredentials.keypair,
      })
    ),
    TE.chainEitherKW(stringifyToPrettyJson)
  )
}
