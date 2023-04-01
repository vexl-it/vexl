import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import {parseAuthFile} from '../utils/auth'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as A from 'fp-ts/Array'
import {getPrivateApi} from '../api'
import {decryptOffer} from './utils/decryptOffer'
import {stringifyToJson} from '../utils/parsing'
import {saveFile} from '../utils/fs'
import {type IsoDatetimeString} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'

export async function getNewOffers({
  modifiedAt,
  credentialsFile,
  outFile,
}: {
  modifiedAt: IsoDatetimeString
  credentialsFile: PathString
  outFile: PathString
}) {
  await pipe(
    parseAuthFile(credentialsFile),
    TE.fromEither,
    TE.bindTo('credentials'),
    TE.bindW('api', ({credentials}) => TE.right(getPrivateApi(credentials))),
    TE.bindW('offers', ({api}) =>
      api.offer.getOffersForMeModifiedOrCreatedAfter({
        modifiedAt,
      })
    ),
    TE.chainW(({api, offers, credentials}) =>
      pipe(
        offers.offers,
        A.map(decryptOffer(credentials.keypair)),
        A.sequence(TE.ApplicativeSeq)
      )
    ),
    TE.chainEitherKW(stringifyToJson),
    TE.chainEitherKW(saveFile(outFile)),
    TE.match(
      (e) => {
        console.error('Error while getting offers', e)
      },
      () => {
        console.log(`Offers saved to: ${outFile}`)
      }
    )
  )()
}
