import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import {pipe} from 'fp-ts/function'
import {
  type CreatedOffer,
  readCreatedOfferFromFile,
  saveCreatedOfferToFile,
} from './CreatedOffer'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {getPrivateApi} from '../api'
import {fetchContactsAndCreateEncryptedPrivateParts} from './utils/fetchContactsAndCreateEncryptedPrivateParts'
import encryptOfferPublicPart from './utils/encryptOfferPublicPart'
import {decryptOffer} from './utils/decryptOffer'

export default async function updatePublicPart({
  offerFilePath,
  outFilePath,
  updatePrivateParts,
}: {
  offerFilePath: PathString
  outFilePath: PathString
  updatePrivateParts: boolean
}) {
  await pipe(
    readCreatedOfferFromFile(offerFilePath),
    E.bindW('api', ({ownerCredentials}) =>
      E.right(getPrivateApi(ownerCredentials))
    ),
    TE.fromEither,
    TE.bindW(
      'offerPrivateList',
      ({api, symmetricKey, ownerCredentials, connectionLevel}) => {
        return updatePrivateParts
          ? fetchContactsAndCreateEncryptedPrivateParts({
              api: api.contact,
              symmetricKey,
              ownerCredentials: ownerCredentials.keypair,
              connectionLevel,
            })
          : TE.right([])
      }
    ),
    TE.bindW('payloadPublic', ({offerInfo, symmetricKey}) =>
      encryptOfferPublicPart({
        offerPublicPart: offerInfo.publicPart,
        symmetricKey,
      })
    ),
    TE.bindW(
      'response',
      ({api, payloadPublic, offerPrivateList, adminId, ownerCredentials}) =>
        pipe(
          api.offer.updateOffer({offerPrivateList, payloadPublic, adminId}),
          TE.chainW(decryptOffer(ownerCredentials.keypair))
        )
    ),
    TE.map(
      ({
        connectionLevel,
        response,
        keypair,
        symmetricKey,
        adminId,
        ownerCredentials,
      }) =>
        ({
          connectionLevel,
          offerInfo: response,
          keypair,
          symmetricKey,
          adminId,
          ownerCredentials,
        } as CreatedOffer)
    ),
    TE.chainEitherKW(saveCreatedOfferToFile(outFilePath)),
    TE.match(
      (e) => {
        console.error('Error while updating offer', e)
      },
      () => {
        console.log(`Offer updated, saved into: ${outFilePath}`)
      }
    )
  )()
}
