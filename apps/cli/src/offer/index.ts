import {type PathString} from '@vexl-next/domain/dist/utility/PathString.brand'
import dummyOffer from './dummyOffer'
import {flow, pipe} from 'fp-ts/function'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import * as A from 'fp-ts/Array'
import {parseJson, safeParse, stringifyToJson} from '../utils/parsing'
import {readFile, saveFile} from '../utils/fs'
import {
  type FriendLevel,
  OfferType,
} from '@vexl-next/domain/dist/general/offers'
import {getPrivateApi} from '../api'
import {type ContactPrivateApi} from '@vexl-next/rest-api/dist/services/contact'
import {parseAuthFile} from '../utils/auth'
import {type PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {keys} from '../utils/objectKeys'
import nodeCrypto from 'node:crypto'
import {aesGCMIgnoreTagEncrypt} from '../utils/crypto'
import {type ConnectionLevel} from '@vexl-next/rest-api/dist/services/contact/contracts'

interface PrivatePayload {
  readonly publicKey: PublicKeyPemBase64
  readonly commonFriends: string[]
  readonly friendLevel: FriendLevel[]
  readonly symmetricKey: string
}

function fetchFriendsPublicKeys({
  lvl,
  api,
}: {
  lvl: ConnectionLevel
  api: ContactPrivateApi
}) {
  return pipe(
    api.fetchMyContacts({
      level: lvl,
      page: 0,
      limit: 1000000,
    }),
    TE.map((res) => res.items.map((one) => one.publicKey))
  )
}

function createPrivatePayloads({
  firstDegreeOnly,
  api,
  symmetricKey,
}: {
  firstDegreeOnly: boolean
  api: ContactPrivateApi
  symmetricKey: string
}) {
  return pipe(
    fetchFriendsPublicKeys({lvl: 'FIRST', api}),
    TE.bindTo('firstDegreeFriends'),
    TE.bindW('secondDegreeFriends', () =>
      firstDegreeOnly
        ? TE.right([])
        : fetchFriendsPublicKeys({lvl: 'SECOND', api})
    ),
    TE.bindW('commonFriends', ({firstDegreeFriends, secondDegreeFriends}) =>
      api.fetchCommonConnections({
        publicKeys: Array.from(
          new Set<PublicKeyPemBase64>([
            ...firstDegreeFriends,
            ...secondDegreeFriends,
          ])
        ),
      })
    ),
    TE.map(({firstDegreeFriends, secondDegreeFriends, commonFriends}) => {
      const friendLevel: Record<
        PublicKeyPemBase64,
        ['FIRST_DEGREE' | 'SECOND_DEGREE'] | ['FIRST_DEGREE', 'SECOND_DEGREE']
      > = {}
      for (const firstDegreeFriendPublicKey of firstDegreeFriends) {
        friendLevel[firstDegreeFriendPublicKey] = ['FIRST_DEGREE']
      }
      for (const secondDegreeFriendPublicKey of secondDegreeFriends) {
        const existing = friendLevel[secondDegreeFriendPublicKey]
        if (existing.includes('FIRST_DEGREE')) {
          friendLevel[secondDegreeFriendPublicKey] = [
            'FIRST_DEGREE',
            'SECOND_DEGREE',
          ]
        } else {
          friendLevel[secondDegreeFriendPublicKey] = ['SECOND_DEGREE']
        }
      }

      return keys(friendLevel).map((key) => ({
        publicKey: key,
        commonFriends:
          commonFriends.commonContacts.find((one) => one.publicKey === key) ??
          [],
        friendLevel: friendLevel[key],
        symmetricKey,
      }))
    })
  )
}

function encryptPrivateOffer({
  offerPayloadPath,
  key,
}: {
  offerPayloadPath: PathString
  key: string
}) {
  return pipe(
    TE.fromEither(readFile(offerPayloadPath)),
    TE.chainW(aesGCMIgnoreTagEncrypt(key))
  )
}

function safeOfferType(offerPayloadPath: PathString) {
  return pipe(
    readFile(offerPayloadPath),
    E.chainW(parseJson),
    E.map((one) => one.offerType),
    E.chainW(safeParse(OfferType))
  )
}

export function createOffer({
  lvl,
  offerPayloadPath,
  authFilePath,
}: {
  lvl: FriendLevel
  offerPayloadPath: PathString
  authFilePath: PathString
}) {
  return pipe(
    TE.Do,
    TE.bindW('symmetricKey', () =>
      TE.right(nodeCrypto.randomBytes(32).toString('base64'))
    ),
    TE.bindW('offerType', () => TE.fromEither(safeOfferType(offerPayloadPath))),
    TE.bindW('encryptedOffer', ({symmetricKey}) =>
      encryptPrivateOffer({offerPayloadPath, key: symmetricKey})
    ),
    TE.bindW('credentials', () => TE.fromEither(parseAuthFile(authFilePath))),
    TE.bindW('api', ({credentials}) => TE.right(getPrivateApi(credentials))),
    TE.bindW('payloads', ({api, symmetricKey}) =>
      createPrivatePayloads({
        firstDegreeOnly: lvl === 'FIRST_DEGREE',
        api: api.contact,
        symmetricKey,
      })
    ),
    TE.bindW('privateParts', ({payloads, symmetricKey}) =>
      pipe(
        payloads,
        A.map(
          flow(
            TE.right,
            TE.bindTo('privatePayload'),
            TE.bindW('stringified', ({privatePayload}) => {
              return pipe(
                TE.right({
                  commonFriends: privatePayload.commonFriends,
                  friendLevel: privatePayload.friendLevel,
                  symmetricKey,
                }),
                TE.chainEitherKW(stringifyToJson)
              )
            }),
            TE.bindW('encrypted', ({privatePayload, stringified}) =>
              aesGCMIgnoreTagEncrypt(privatePayload.publicKey)(stringified)
            ),
            TE.map(({privatePayload, encrypted}) => ({
              userPublicKey: privatePayload.publicKey,
              payloadPrivate: encrypted,
            }))
          )
        ),
        A.sequence(TE.ApplicativeSeq)
      )
    ),
    TE.chainW(({api, payloads, encryptedOffer, privateParts, offerType}) =>
      api.offer.createNewOffer({
        offerPrivateList: privateParts,
        payloadPublic: encryptedOffer,
        offerType,
      })
    )
  )
}

export function outputDummyOffer({outFile}: {outFile: PathString}) {
  pipe(
    dummyOffer,
    E.right,
    E.chainW(stringifyToJson),
    E.chainW(saveFile(outFile)),
    E.match(
      (e) => {
        console.error('Error while saving dummy offer to file.', e)
      },
      () => {
        console.log(`Saved to file: ${outFile}`)
      }
    )
  )
}
