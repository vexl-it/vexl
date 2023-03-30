import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import {pipe} from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import * as A from 'fp-ts/Array'
import {parseJson, safeParse, stringifyToJson} from '../utils/parsing'
import {readFile} from '../utils/fs'
import {OfferPublicPart} from '@vexl-next/domain/dist/general/offers'
import {getPrivateApi} from '../api'
import {parseAuthFile} from '../utils/auth'
import nodeCrypto from 'node:crypto'
import {aesGCMIgnoreTagEncrypt} from '../utils/crypto'
import {type ConnectionLevel} from '@vexl-next/rest-api/dist/services/contact/contracts'
import {fetchContactsAndCreateEncryptedPrivateParts} from './utils/fetchContactsAndCreateEncryptedPrivateParts'
import * as crypto from '@vexl-next/cryptography'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {type CreatedOffer, saveCreatedOfferToFile} from './CreatedOffer'

function encryptPublicOffer({
  offerPublicPart,
  key,
}: {
  offerPublicPart: OfferPublicPart
  key: string
}) {
  return pipe(
    offerPublicPart.location,
    A.map(stringifyToJson),
    A.sequence(E.Applicative),
    TE.fromEither,
    TE.map((location) => ({...offerPublicPart, location})),

    TE.chainEitherKW(stringifyToJson),
    TE.map((a) => {
      console.log('stringified', a)
      return a
    }),
    TE.chainW(aesGCMIgnoreTagEncrypt(key)),
    TE.map((encrypted) => `0${encrypted}`)
  )
}

function readPublicPartFromFile({
  offerPublicKey,
  offerPayloadPath,
}: {
  offerPayloadPath: PathString
  offerPublicKey: PublicKeyPemBase64
}) {
  return pipe(
    readFile(offerPayloadPath),
    E.chainW(parseJson),
    // set proper public key
    E.map(
      (offer) =>
        ({
          ...offer,
          offerPublicKey,
        } as OfferPublicPart)
    ),
    E.chainW(safeParse(OfferPublicPart))
  )
}

export default async function createOffer({
  connectionLevel,
  offerPayloadPath,
  authFilePath,
  outFilePath,
}: {
  connectionLevel: ConnectionLevel
  offerPayloadPath: PathString
  authFilePath: PathString
  outFilePath: PathString
}) {
  await pipe(
    TE.Do,
    TE.bindW('symmetricKey', () =>
      TE.right(nodeCrypto.randomBytes(32).toString('base64'))
    ),
    TE.bindW('keypair', () => TE.right(crypto.KeyHolder.generatePrivateKey())),
    TE.bindW('offerPublicPart', ({keypair}) =>
      TE.fromEither(
        readPublicPartFromFile({
          offerPayloadPath,
          offerPublicKey: keypair.publicKeyPemBase64,
        })
      )
    ),
    TE.bindW('encryptedOffer', ({symmetricKey, offerPublicPart}) =>
      encryptPublicOffer({offerPublicPart, key: symmetricKey})
    ),
    TE.bindW('userCredentials', () =>
      TE.fromEither(parseAuthFile(authFilePath))
    ),
    TE.bindW('api', ({userCredentials}) =>
      TE.right(getPrivateApi(userCredentials))
    ),
    TE.bindW('privateParts', ({api, userCredentials, symmetricKey}) =>
      fetchContactsAndCreateEncryptedPrivateParts({
        symmetricKey,
        api: api.contact,
        keypair: userCredentials.keypair,
        connectionLevel,
      })
    ),
    TE.bindW(
      'createdOfferResponse',
      ({api, privateParts, encryptedOffer, userCredentials, offerPublicPart}) =>
        api.offer.createNewOffer({
          offerPrivateList: privateParts,
          payloadPublic: encryptedOffer,
          offerType: offerPublicPart.offerType,
        })
    ),
    TE.map(
      ({
        createdOfferResponse,
        keypair,
        userCredentials,
        symmetricKey,
        offerPublicPart,
      }) =>
        ({
          offerId: createdOfferResponse.offerId,
          adminId: createdOfferResponse.adminId,
          keypair,
          symmetricKey,
          offerPublicPart,
          ownerCredentials: userCredentials,
        } as CreatedOffer)
    ),
    TE.chainEitherKW(saveCreatedOfferToFile(outFilePath)),
    TE.match(
      (e) => {
        console.error('Error while creating offer', e)
      },
      () => {
        console.log(`Offer created. Result saved into ${outFilePath}`)
      }
    )
  )()
}
