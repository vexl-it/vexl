import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  generateChatId,
  generateChatMessageId,
  ReactionEmoji,
} from '@vexl-next/domain/src/general/messaging'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Deferred, Effect, Fiber, HashSet, Schema} from 'effect'
import {atom, createStore} from 'jotai'
import {type ChatWithMessages} from '../domain'
import sendReactionActionAtom from './sendReactionActionAtom'

const mockSends: Array<Deferred.Deferred<undefined, string>> = []
function mockSendMessage(): Effect.Effect<undefined, string> {
  const send = Effect.runSync(Deferred.make<undefined, string>())
  mockSends.push(send)
  return Deferred.await(send)
}
jest.mock('@vexl-next/resources-utils/src/chat/sendMessage', () => ({
  __esModule: true,
  default: () => mockSendMessage(),
}))
jest.mock('../../../api', () => ({
  apiAtom: jest.requireActual('jotai').atom({chat: {}, notification: {}}),
}))

const heart = Schema.decodeSync(ReactionEmoji)('❤️')
const thumbsUp = Schema.decodeSync(ReactionEmoji)('👍')
const targetMessageId = generateChatMessageId()

function setup(): {
  react: (emoji: ReactionEmoji) => Fiber.RuntimeFiber<void, unknown>
  mine: () => ReactionEmoji | undefined
  sends: Array<Deferred.Deferred<undefined, string>>
} {
  mockSends.length = 0
  const store = createStore()
  const chatAtom = atom<ChatWithMessages>({
    chat: {
      id: generateChatId(),
      inbox: {privateKey: generatePrivateKey()},
      otherSide: {publicKey: generatePrivateKey().publicKeyPemBase64},
      origin: {type: 'unknown'},
      isUnread: false,
      showInfoBar: true,
      showVexlbotInitialMessage: true,
      showVexlbotNotifications: true,
      otherSideVersion: Schema.decodeSync(VersionString)('26.11.0'),
    },
    messages: [],
    hiddenMessagesIds: HashSet.empty(),
    tradeChecklist: {
      dateAndTime: {},
      location: {},
      amount: {},
      network: {},
      identity: {},
      contact: {},
    },
    feedbackSubmitted: false,
    reactions: {},
  })
  const sendReactionAtom = sendReactionActionAtom(chatAtom)

  return {
    react: (emoji) =>
      Effect.runFork(store.set(sendReactionAtom, {targetMessageId, emoji})),
    mine: () => store.get(chatAtom).reactions[targetMessageId]?.mine,
    sends: mockSends,
  }
}

async function settle(
  send: Deferred.Deferred<undefined, string> | undefined,
  fiber: Fiber.RuntimeFiber<void, unknown>,
  outcome: 'succeed' | 'fail'
): Promise<void> {
  if (!send) throw new Error('send was not started')
  await Effect.runPromise(
    outcome === 'succeed'
      ? Deferred.succeed(send, undefined)
      : Deferred.fail(send, 'offline')
  )
  await Effect.runPromise(Fiber.await(fiber))
}

describe('sendReactionActionAtom', () => {
  it('shows nothing when two overlapping sends both fail', async () => {
    const {react, mine, sends} = setup()
    const first = react(heart)
    const second = react(thumbsUp)
    expect(mine()).toBe(thumbsUp)

    await settle(sends[0], first, 'fail')
    expect(mine()).toBe(thumbsUp)
    await settle(sends[1], second, 'fail')
    expect(mine()).toBeUndefined()
  })

  it('shows an older reaction that was delivered after a newer one failed', async () => {
    const {react, mine, sends} = setup()
    const first = react(heart)
    const second = react(thumbsUp)

    await settle(sends[1], second, 'fail')
    await settle(sends[0], first, 'succeed')
    expect(mine()).toBe(heart)
  })

  it('keeps the newest delivered reaction', async () => {
    const {react, mine, sends} = setup()
    const first = react(heart)
    const second = react(thumbsUp)

    await settle(sends[1], second, 'succeed')
    await settle(sends[0], first, 'succeed')
    expect(mine()).toBe(thumbsUp)
  })
})
