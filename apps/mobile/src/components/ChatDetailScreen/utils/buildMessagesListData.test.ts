import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateChatMessageId} from '@vexl-next/domain/src/general/messaging'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {HashSet, Schema} from 'effect'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {createEmptyTradeChecklistInState} from '../../../state/tradeChecklist/domain'
import buildMessagesListData from './buildMessagesListData'

jest.mock('../../../utils/localization/I18nProvider', () => ({
  getCurrentLocale: () => 'en-US',
}))

jest.mock('../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const sender = generatePrivateKey()

function message({
  text,
  minute,
  restored,
}: {
  text: string
  minute: number
  restored?: boolean
}): ChatMessageWithState {
  return {
    state: 'received',
    restored,
    message: {
      uuid: generateChatMessageId(),
      text,
      messageType: 'MESSAGE',
      senderPublicKey: sender.publicKeyPemBase64,
      time: Schema.decodeSync(UnixMilliseconds)(
        Date.UTC(2026, 0, 1, 12, minute)
      ),
    },
  }
}

function listShape(messages: ChatMessageWithState[]): string[] {
  return buildMessagesListData(
    messages,
    HashSet.empty(),
    createEmptyTradeChecklistInState()
  )
    .filter(
      (item) => item.type === 'message' || item.type === 'restoredDivider'
    )
    .map((item) =>
      item.type === 'message' ? item.message.message.text : 'divider'
    )
}

it('separates restored messages from live ones', () => {
  expect(
    listShape([
      message({text: 'r1', minute: 0, restored: true}),
      message({text: 'r2', minute: 1, restored: true}),
      message({text: 'live', minute: 2}),
    ])
  ).toEqual(['r1', 'r2', 'divider', 'live'])
})

it('shows no divider in chats without restored messages', () => {
  expect(
    listShape([
      message({text: 'a', minute: 0}),
      message({text: 'b', minute: 1}),
    ])
  ).not.toContain('divider')
})
