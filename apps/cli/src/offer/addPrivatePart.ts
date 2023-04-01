import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {type FriendLevel} from '@vexl-next/domain/dist/general/offers'
import {readCreatedOfferFromFile} from './CreatedOffer'
import {getPrivateApi} from '../api'
import {pipe} from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {encryptPrivatePart} from './utils/fetchContactsAndCreateEncryptedPrivateParts'

export default async function addPrivatePart({
  createdOfferFilePath,
  contactFriendLevel,
  contactPublicKey,
}: {
  createdOfferFilePath: PathString
  contactPublicKey: PublicKeyPemBase64
  contactFriendLevel: FriendLevel[]
}) {
  await pipe(
    readCreatedOfferFromFile(createdOfferFilePath),
    E.bindW('api', ({ownerCredentials}) =>
      E.right(getPrivateApi(ownerCredentials))
    ),
    TE.fromEither,
    TE.bindW('commonConnections', ({api, ownerCredentials}) => {
      return pipe(
        api.contact.fetchCommonConnections({
          publicKeys: [contactPublicKey],
        }),
        TE.map((response) => response.commonContacts[0]?.common?.hashes ?? [])
      )
    }),
    TE.bindW(
      'encryptedPrivatePart',
      ({commonConnections, symmetricKey, ownerCredentials}) =>
        encryptPrivatePart({
          userPublicKey: ownerCredentials.keypair.publicKeyPemBase64,
          payloadPrivate: {
            commonFriends: commonConnections,
            friendLevel: contactFriendLevel,
            symmetricKey,
          },
        })
    ),
    TE.chainW(({api, encryptedPrivatePart, adminId}) =>
      api.offer.createPrivatePart({
        adminId,
        offerPrivateList: [encryptedPrivatePart],
      })
    ),
    TE.match(
      (e) => {
        console.error('Error while adding private part', e)
      },
      () => {
        console.log('Successfully added private part')
      }
    )
  )()
}
