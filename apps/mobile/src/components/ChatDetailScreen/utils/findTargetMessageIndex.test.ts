import {generateChatMessageId} from '@vexl-next/domain/src/general/messaging'
import findTargetMessageIndex, {
  type TargetMessageIndexListItem,
} from './findTargetMessageIndex'

function messageListItem(
  uuid: ReturnType<typeof generateChatMessageId>
): TargetMessageIndexListItem {
  return {
    type: 'message',
    message: {
      message: {
        uuid,
      },
    },
  }
}

it('finds a visible message item by uuid', () => {
  const firstMessageId = generateChatMessageId()
  const targetMessageId = generateChatMessageId()

  expect(
    findTargetMessageIndex({
      messagesList: [
        {type: 'time'},
        messageListItem(firstMessageId),
        {type: 'space'},
        messageListItem(targetMessageId),
      ],
      targetMessageId,
    })
  ).toBe(3)
})

it('ignores non-message rows', () => {
  const targetMessageId = generateChatMessageId()

  expect(
    findTargetMessageIndex({
      messagesList: [
        {type: 'time'},
        {type: 'space'},
        {type: 'typingIndicator'},
        messageListItem(targetMessageId),
      ],
      targetMessageId,
    })
  ).toBe(3)
})

it('returns no index for missing messages', () => {
  expect(
    findTargetMessageIndex({
      messagesList: [
        {type: 'time'},
        messageListItem(generateChatMessageId()),
        {type: 'typingIndicator'},
      ],
      targetMessageId: generateChatMessageId(),
    })
  ).toBeUndefined()
})
