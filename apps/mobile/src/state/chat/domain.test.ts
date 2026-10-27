import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {Schema} from 'effect'
import {OffersState} from '../marketplace/domain'
import {MessagingState} from './domain'

jest.mock('../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('url-join', () => jest.fn())

const VEXL_TOKEN = 'vexl_nt_legacy'
const NEW_VEXL_TOKEN = 'vexl_nt_new'

function persistedChat(
  id: string,
  chatFields: Record<string, unknown>
): unknown {
  return {
    chat: {
      id,
      inbox: {privateKey: generatePrivateKey()},
      origin: {type: 'unknown'},
      otherSide: {publicKey: generatePrivateKey().publicKeyPemBase64},
      ...chatFields,
    },
    messages: [],
  }
}

describe('MessagingState chat token migration', () => {
  it('decodes chats persisted by older app versions', () => {
    const state = Schema.decodeUnknownSync(MessagingState)([
      {
        inbox: {privateKey: generatePrivateKey()},
        chats: [
          persistedChat('legacyToken', {otherSideFcmCypher: VEXL_TOKEN}),
          persistedChat('legacyCypher', {
            otherSideFcmCypher: 'EXPO_V2.someEncryptedCypher',
          }),
          persistedChat('bothKeys', {
            otherSideFcmCypher: VEXL_TOKEN,
            otherSideVexlToken: NEW_VEXL_TOKEN,
          }),
          persistedChat('noToken', {}),
        ],
      },
    ])

    const chats = state[0]?.chats.map(({chat}) => chat)
    expect(chats?.map((chat) => chat.otherSideVexlToken)).toEqual([
      VEXL_TOKEN,
      undefined,
      NEW_VEXL_TOKEN,
      undefined,
    ])
    expect(chats?.some((chat) => 'otherSideFcmCypher' in chat)).toBe(false)
  })

  it('encodes only the vexl token', () => {
    const state = Schema.decodeUnknownSync(MessagingState)([
      {
        inbox: {privateKey: generatePrivateKey()},
        chats: [persistedChat('legacyToken', {otherSideFcmCypher: VEXL_TOKEN})],
      },
    ])

    const encodedChat =
      Schema.encodeSync(MessagingState)(state)[0]?.chats[0]?.chat
    expect(encodedChat).toMatchObject({otherSideVexlToken: VEXL_TOKEN})
    expect(encodedChat).not.toHaveProperty('otherSideFcmCypher')
  })
})

function persistedOffer(fcmCypher: string): unknown {
  return {
    offerInfo: {
      id: 1,
      offerId: 'offerId',
      privatePart: {
        commonFriends: [],
        friendLevel: ['FIRST_DEGREE'],
        symmetricKey: 'symmetric-key',
      },
      publicPart: {
        offerPublicKey: generatePrivateKey().publicKeyPemBase64,
        location: [],
        offerDescription: 'offer',
        amountBottomLimit: 0,
        amountTopLimit: 100,
        feeState: 'WITHOUT_FEE',
        feeAmount: 0,
        locationState: ['ONLINE'],
        paymentMethod: ['BANK'],
        btcNetwork: ['LIGHTING'],
        currency: 'CZK',
        spokenLanguages: ['ENG'],
        offerType: 'SELL',
        activePriceState: 'NONE',
        activePriceValue: 0,
        activePriceCurrency: 'CZK',
        active: true,
        groupUuids: [],
        fcmCypher,
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      modifiedAt: '2026-01-01T00:00:00.000Z',
    },
    flags: {},
  }
}

describe('Persisted offer fcmCypher', () => {
  it.each(['EXPO_V2.someEncryptedCypher', VEXL_TOKEN])(
    'drops %s from a chat origin offer',
    (fcmCypher) => {
      const state = Schema.decodeUnknownSync(MessagingState)([
        {
          inbox: {privateKey: generatePrivateKey()},
          chats: [
            persistedChat('theirOffer', {
              origin: {
                type: 'theirOffer',
                offerId: 'offerId',
                offer: persistedOffer(fcmCypher),
              },
            }),
          ],
        },
      ])

      const origin = state[0]?.chats[0]?.chat.origin
      expect(
        origin?.type === 'theirOffer' ? origin.offer?.offerInfo.publicPart : {}
      ).not.toHaveProperty('fcmCypher')
    }
  )

  it('drops a legacy cypher from the persisted offers list', () => {
    const state = Schema.decodeUnknownSync(OffersState)({
      offers: [persistedOffer('EXPO_V2.someEncryptedCypher')],
    })

    expect(state.offers[0]?.offerInfo.publicPart).not.toHaveProperty(
      'fcmCypher'
    )
  })
})
