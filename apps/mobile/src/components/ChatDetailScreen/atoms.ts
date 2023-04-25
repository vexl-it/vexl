import {atom, type SetStateAction, type WritableAtom} from 'jotai'
import {createScope, molecule} from 'jotai-molecules'
import {generateChatId} from '@vexl-next/domain/dist/general/messaging'
import {offerForChatOriginAtom} from '../../state/marketplace/atom'
import {selectAtom, splitAtom} from 'jotai/utils'
import {generatePrivateKey} from '@vexl-next/cryptography/dist/KeyHolder'
import sendMessageActionAtom from '../../state/chat/atoms/sendMessageActionAtom'
import {type ChatWithMessages} from '../../state/chat/domain'
import {messagesToListData} from './utils'
import focusRequestMessageAtom from '../../state/chat/atoms/focusRequestMessageAtom'
import {focusAtom} from 'jotai-optics'
import {focusWasDeniedAtom} from '../../state/chat/atoms/focusDenyRequestMessageAtom'
import deleteChatActionAtom from '../../state/chat/atoms/deleteChatActionAtom'
import blockChatActionAtom from '../../state/chat/atoms/blockChatActionAtom'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {loadingOverlayDisplayedAtom} from '../LoadingOverlayProvider'
import {Alert} from 'react-native'
import randomName from '../../utils/randomName'
import selectOtherSideDataAtom from '../../state/chat/atoms/selectOtherSideDataAtom'
import focusOtherSideLeftAtom from '../../state/chat/atoms/focusOtherSideLeftAtom'
import {askAreYouSureActionAtom} from '../AreYouSureDialog'
import {deleteChatStep1Svg} from './images/deleteChatSvg'
import {translationAtom} from '../../utils/localization/I18nProvider'

type ChatUIMode = 'approval' | 'messages'

export const dummyChatWithMessages: ChatWithMessages = {
  chat: {
    id: generateChatId(),
    inbox: {privateKey: generatePrivateKey()},
    otherSide: {publicKey: generatePrivateKey().publicKeyPemBase64},
    origin: {type: 'unknown'},
    isUnread: false,
  },
  messages: [],
}

export const ChatScope = createScope<
  WritableAtom<ChatWithMessages, [SetStateAction<ChatWithMessages>], void>
>(atom<ChatWithMessages>(dummyChatWithMessages))

export const chatMolecule = molecule((getMolecule, getScope) => {
  const chatWithMessagesAtom = getScope(ChatScope)

  const chatAtom = focusAtom(chatWithMessagesAtom, (o) => o.prop('chat'))

  const messagesAtom = selectAtom(
    chatWithMessagesAtom,
    (o) => o?.messages ?? []
  )
  const messageAtomAtoms = splitAtom(messagesAtom)

  const offerForChatAtom = atom((get) => {
    const origin = get(chatAtom)?.origin
    return origin ? get(offerForChatOriginAtom(origin)) : null
  })

  const messagesListDataAtom = selectAtom(messagesAtom, messagesToListData)
  const messagesListAtomAtoms = splitAtom(messagesListDataAtom)

  const deleteChatAtom = deleteChatActionAtom(chatWithMessagesAtom)

  const nameAtom = selectAtom(chatAtom, (o) => randomName(o.id))

  const deleteChatWithUiFeedbackAtom = atom(null, async (get, set) => {
    const {t} = get(translationAtom)
    return await pipe(
      set(askAreYouSureActionAtom, {
        steps: [
          {
            image: {
              type: 'svgXml',
              svgXml: deleteChatStep1Svg,
            },
            title: t('messages.deleteChatQuestion'),
            description: t('messages.deleteChatExplanation1'),
            negativeButtonText: t('common.back'),
            positiveButtonText: t('messages.yesDelete'),
          },
          {
            image: {
              type: 'svgXml',
              svgXml: deleteChatStep1Svg,
            },
            title: t('common.youSure'),
            description: t('messages.deleteChatExplanation2'),
            negativeButtonText: t('common.nope'),
            positiveButtonText: t('messages.deleteChat'),
          },
        ],
        variant: 'info',
      }),
      TE.map((val) => {
        set(loadingOverlayDisplayedAtom, true)
        return val
      }),
      TE.chainW(() => set(deleteChatAtom, {text: 'deleting chat'})),
      // TODO handle all error cases. Mainly network errors. On error with server, we should remove anyway
      TE.match(
        (e) => {
          set(loadingOverlayDisplayedAtom, false)

          if (e._tag !== 'UserDeclinedError') {
            Alert.alert('Error', 'Error deleting chat')
          }
          return false
        },
        () => {
          set(loadingOverlayDisplayedAtom, false)
          return true
        }
      )
    )()
  })

  const blockChatAtom = blockChatActionAtom(chatWithMessagesAtom)
  const blockChatWithUiFeedbackAtom = atom(null, async (get, set) => {
    const {t} = get(translationAtom)

    return await pipe(
      set(askAreYouSureActionAtom, {
        steps: [
          {
            image: {
              type: 'requiredImage',
              image: require('./images/blockChat1.png'),
            },
            title: t('messages.blockForewerQuestion'),
            description: t('messages.blockChatExplanation1'),
            negativeButtonText: t('common.nope'),
            positiveButtonText: t('messages.yesBlock'),
          },
          {
            image: {
              type: 'requiredImage',
              image: require('./images/blockChat1.png'),
            },
            title: t('common.youSure'),
            description: t('messages.blockChatExplanation2'),
            negativeButtonText: t('common.nope'),
            positiveButtonText: t('messages.yesBlock'),
          },
        ],
        variant: 'danger',
      }),
      TE.map((val) => {
        set(loadingOverlayDisplayedAtom, true)
        return val
      }),
      TE.chainW(() => set(blockChatAtom, {text: 'Blocking chat'})),
      TE.match(
        (e) => {
          set(loadingOverlayDisplayedAtom, false)
          if (e._tag !== 'UserDeclinedError') {
            Alert.alert('Error', 'Error deleting chat')
          }
          return false
        },
        () => {
          set(loadingOverlayDisplayedAtom, false)
          return true
        }
      )
    )()
  })

  const lastMessageAtom = selectAtom(messagesAtom, (o) => o.at(-1))

  const chatUiModeAtom = atom<ChatUIMode>((get) => {
    const messages = get(messagesAtom)
    if (messages.at(-1)?.message.messageType === 'REQUEST_MESSAGING')
      return 'approval'
    if (
      messages.some((one) => one.message.messageType === 'DISAPPROVE_MESSAGING')
    )
      return 'approval'

    return 'messages'
  })

  const canSendMessagesAtom = selectAtom(messagesAtom, (o) => {
    const lastMessage = o.at(-1)

    return !(
      (lastMessage?.state === 'received' &&
        lastMessage.message.messageType === 'INBOX_DELETED') ||
      lastMessage?.message.messageType === 'BLOCK_CHAT'
    )
  })

  return {
    showModalAtom: atom<boolean>(false),
    chatAtom,
    nameAtom,
    chatWithMessagesAtom,
    messagesAtom,
    messageAtomAtoms,
    offerForChatAtom,
    chatUiModeAtom,
    sendMessageAtom: sendMessageActionAtom(chatWithMessagesAtom),
    requestMessageAtom: focusRequestMessageAtom(chatWithMessagesAtom),
    wasDeniedAtom: focusWasDeniedAtom(chatWithMessagesAtom),
    otherSideDataAtom: selectOtherSideDataAtom(chatAtom),
    otherSideLeftAtom: focusOtherSideLeftAtom(chatWithMessagesAtom),
    deleteChatWithUiFeedbackAtom,
    blockChatWithUiFeedbackAtom,
    messagesListAtomAtoms,
    lastMessageAtom,
    canSendMessagesAtom,
  }
})
