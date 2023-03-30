import {type OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {getPrivateApiFromCredentialsFile} from '../api'

export default async function deleteOffer({
  adminIds,
  credentialsFilePath,
}: {
  adminIds: OfferAdminId[]
  credentialsFilePath: PathString
}) {
  await pipe(
    getPrivateApiFromCredentialsFile(credentialsFilePath),
    TE.fromEither,
    TE.chainW((api) => api.offer.deleteOffer({adminIds})),
    TE.match(
      (error) => {
        console.error('Error while deleting offers', error)
      },
      () => {
        console.log('Offers deleted')
      }
    )
  )()
}
