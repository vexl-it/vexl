import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {keys} from '../../utils/objectKeys'
import {type OfferPrivatePart} from '@vexl-next/domain/dist/general/offers'
import {
  type ConnectionLevel,
  type FetchCommonConnectionsResponse,
} from '@vexl-next/rest-api/dist/services/contact/contracts'
import {type ContactPrivateApi} from '@vexl-next/rest-api/dist/services/contact'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {stringifyToJson} from '../../utils/parsing'
import {eciesEncrypt} from '../../utils/crypto'
import * as A from 'fp-ts/Array'

interface OfferPrivatePartToEncrypt {
  userPublicKey: PublicKeyPemBase64
  payloadPrivate: OfferPrivatePart
}

function constructPrivatePayloads({
  firstDegreeFriends,
  secondDegreeFriends,
  commonFriends,
  symmetricKey,
  keypair,
}: {
  firstDegreeFriends: PublicKeyPemBase64[]
  secondDegreeFriends: PublicKeyPemBase64[]
  commonFriends: FetchCommonConnectionsResponse
  symmetricKey: string
  keypair: PrivateKeyHolder
}): OfferPrivatePartToEncrypt[] {
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

  const currentUserCredentials = {
    userPublicKey: keypair.publicKeyPemBase64,
    payloadPrivate: {
      commonFriends: [],
      friendLevel: ['NOT_SPECIFIED'],
      symmetricKey,
    },
  } as OfferPrivatePartToEncrypt

  const offersForFriends = keys(friendLevel).map(
    (key) =>
      ({
        userPublicKey: key,
        payloadPrivate: {
          commonFriends:
            commonFriends.commonContacts.find((one) => one.publicKey === key) ??
            [],
          friendLevel: friendLevel[key],
          symmetricKey,
        },
      } as OfferPrivatePartToEncrypt)
  )

  return [currentUserCredentials, ...offersForFriends]
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

function encryptPrivatePart({
  privatePart,
  symmetricKey,
}: {
  privatePart: OfferPrivatePartToEncrypt
  symmetricKey: string
}) {
  return pipe(
    TE.right(privatePart),
    TE.bindTo('privatePart'),
    TE.bindW('json', ({privatePart}) =>
      TE.fromEither(stringifyToJson(privatePart.payloadPrivate))
    ),
    TE.bindW('encrypted', ({privatePart, json}) =>
      pipe(
        eciesEncrypt(privatePart.userPublicKey)(json),
        TE.map((json) => `0${json}`)
      )
    ),
    TE.map(({privatePart, encrypted}) => ({
      userPublicKey: privatePart.userPublicKey,
      payloadPrivate: encrypted,
    }))
  )
}

function fetchInfoAndCreatePrivateParts({
  connectionLevel,
  api,
  symmetricKey,
  keypair,
}: {
  connectionLevel: ConnectionLevel
  api: ContactPrivateApi
  symmetricKey: string
  keypair: PrivateKeyHolder
}): TE.TaskEither<any, OfferPrivatePartToEncrypt[]> {
  return pipe(
    fetchFriendsPublicKeys({lvl: connectionLevel, api}),
    TE.bindTo('firstDegreeFriends'),
    TE.bindW('secondDegreeFriends', () =>
      connectionLevel === 'FIRST'
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
    TE.map(({firstDegreeFriends, secondDegreeFriends, commonFriends}) =>
      constructPrivatePayloads({
        firstDegreeFriends,
        secondDegreeFriends,
        commonFriends,
        symmetricKey,
        keypair,
      })
    )
  )
}

export function fetchContactsAndCreateEncryptedPrivateParts({
  api,
  symmetricKey,
  keypair,
  connectionLevel,
}: {
  connectionLevel: ConnectionLevel
  api: ContactPrivateApi
  symmetricKey: string
  keypair: PrivateKeyHolder
}) {
  return pipe(
    fetchInfoAndCreatePrivateParts({
      connectionLevel,
      api,
      symmetricKey,
      keypair,
    }),
    TE.chainW(
      flow(
        A.map((privatePart) => encryptPrivatePart({privatePart, symmetricKey})),
        A.sequence(TE.ApplicativeSeq)
      )
    )
  )
}
