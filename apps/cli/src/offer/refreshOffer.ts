import {type OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {getPrivateApiFromCredentialsFile} from '../api'

export default async function refreshOffer({
  adminIds,
  credentialsFilePath,
}: {
  adminIds: OfferAdminId[]
  credentialsFilePath: PathString
}) {
  await pipe(
    getPrivateApiFromCredentialsFile(credentialsFilePath),
    TE.fromEither,
    TE.chainW((api) => api.offer.refreshOffer({adminIds})),
    TE.match(
      (error) => {
        console.error('Error while refreshing offers', error)
      },
      () => {
        console.log('Offers refreshed')
      }
    )
  )()
}
