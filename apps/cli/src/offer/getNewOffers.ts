import {parseCredentialsJson} from '../utils/auth'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {getPrivateApi} from '../api'
import {type IsoDatetimeString} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'
import getNewOffersAndDecrypt from '@vexl-next/resources-utils/dist/offers/getNewOffersAndDecrypt'
import {stringifyToPrettyJson} from '@vexl-next/resources-utils/dist/utils/parsing'

export function getNewOffers({
  modifiedAt,
  credentialsJson,
}: {
  modifiedAt: IsoDatetimeString
  credentialsJson: string
}) {
  return pipe(
    TE.Do,
    TE.bindW('credentials', () =>
      TE.fromEither(parseCredentialsJson(credentialsJson))
    ),
    TE.bindW('api', ({credentials}) => TE.right(getPrivateApi(credentials))),
    TE.chainW(({credentials, api}) =>
      getNewOffersAndDecrypt({
        offersApi: api.offer,
        modifiedAt,
        keyPair: credentials.keypair,
      })
    ),
    TE.chainEitherKW(stringifyToPrettyJson)
  )
}
