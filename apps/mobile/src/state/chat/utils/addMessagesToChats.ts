import {pipe} from 'fp-ts/function'
import * as A from 'fp-ts/Array'
import addToSortedArray from '../../../utils/addToSortedArray'
import compareMessages from './compareMessages'
import areMessagesEqual from './areMessagesEqual'
import {group} from 'group-items'
import * as O from 'optics-ts'
import {type UserNameAndAvatar} from '@vexl-next/domain/dist/general/UserNameAndAvatar.brand'
import {fromBase64Uri} from '@vexl-next/domain/dist/utility/SvgStringOrImageUri.brand'
import {UserName} from '@vexl-next/domain/dist/general/UserName.brand'
import {UnixMilliseconds} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {type ChatMessageWithState, type ChatWithMessages} from '../domain'

function processDeleteChatMessage(
  deleteChatMessage?: ChatMessageWithState
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => {
    if (deleteChatMessage?.message.messageType !== 'DELETE_CHAT') return chat

    const indexOfDeleteMessage = chat.messages.findIndex(
      (message) => message.message.uuid === deleteChatMessage.message.uuid
    )

    return {
      ...chat,
      messages:
        indexOfDeleteMessage !== -1
          ? chat.messages.slice(indexOfDeleteMessage)
          : chat.messages,
    }
  }
}

function processIdentityRevealMessage(
  identityRevealMessage?: ChatMessageWithState
): (chat: ChatWithMessages) => ChatWithMessages {
  return (chat) => {
    if (
      !identityRevealMessage?.message.deanonymizedUser ||
      identityRevealMessage?.message.messageType !== 'APPROVE_REVEAL'
    )
      return chat

    const userName = UserName.safeParse(
      identityRevealMessage.message.deanonymizedUser.name
    )

    const realLifeInfo: UserNameAndAvatar = {
      userName: userName.success ? userName.data : UserName.parse('[unknown]'),
      image: fromBase64Uri(
        identityRevealMessage.message.deanonymizedUser.imageBase64
      ),
    }
    return O.set(realLifeInfoOptic)(realLifeInfo)(chat)
  }
}

const realLifeInfoOptic = O.optic<ChatWithMessages>()
  .prop('otherSide')
  .prop('realLifeInfo')

export default function addMessagesToChats(
  chats: ChatWithMessages[]
): (toAdd: ChatMessageWithState[]) => ChatWithMessages[] {
  return (toAdd) =>
    pipe(
      chats,
      A.map((oneChat) => {
        const messages = toAdd
          .filter(
            (oneMessage) =>
              oneMessage.message.senderPublicKey === oneChat.otherSide.publicKey
          )
          .reduce(
            (originalList, newMessage) =>
              addToSortedArray(
                originalList,
                compareMessages,
                areMessagesEqual
              )(newMessage),
            oneChat.messages
          )

        const messagesByType = group(toAdd.sort(compareMessages))
          .by((message) => message.message.messageType)
          .asMap()

        const deleteTypeMessage = messagesByType.get('DELETE_CHAT')?.at(-1)
        const identityRevealMessage = messagesByType
          .get('APPROVE_REVEAL')
          ?.at(-1)

        const deleteTypeMessageTime =
          deleteTypeMessage?.message.time ?? UnixMilliseconds.parse(0)
        const identityRevealMessageTime =
          identityRevealMessage?.message.time ?? UnixMilliseconds.parse(0)

        if (deleteTypeMessageTime < identityRevealMessageTime) {
          return pipe(
            {...oneChat, messages},
            processDeleteChatMessage(deleteTypeMessage),
            processIdentityRevealMessage(identityRevealMessage)
          )
        } else {
          return pipe(
            {...oneChat, messages},
            processDeleteChatMessage(deleteTypeMessage)
          )
        }
      })
    )
}
