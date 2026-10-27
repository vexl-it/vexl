import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {Schema} from 'effect'
import {MessagingState} from './domain'

jest.mock('../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('url-join', () => jest.fn())

const VEXL_TOKEN = 'vexl_nt_legacy'
const NEW_VEXL_TOKEN = 'vexl_nt_new'

function persistedChat(id: string, tokens: Record<string, string>): unknown {
  return {
    chat: {
      id,
      inbox: {privateKey: generatePrivateKey()},
      origin: {type: 'unknown'},
      otherSide: {publicKey: generatePrivateKey().publicKeyPemBase64},
      ...tokens,
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
