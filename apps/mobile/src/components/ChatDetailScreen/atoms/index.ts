import {
  atom,
  type PrimitiveAtom,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'
import {createScope, molecule} from 'jotai-molecules'
import {generateChatId} from '@vexl-next/domain/dist/general/messaging'
import {offerForChatOriginAtom} from '../../../state/marketplace/atom'
import {selectAtom, splitAtom} from 'jotai/utils'
import {generatePrivateKey} from '@vexl-next/cryptography/dist/KeyHolder'
import sendMessageActionAtom from '../../../state/chat/atoms/sendMessageActionAtom'
import {
  type ChatMessageWithState,
  type ChatWithMessages,
} from '../../../state/chat/domain'
import {messagesToListData} from '../utils'
import focusRequestMessageAtom from '../../../state/chat/atoms/focusRequestMessageAtom'
import {focusAtom} from 'jotai-optics'
import {focusWasDeniedAtom} from '../../../state/chat/atoms/focusDenyRequestMessageAtom'
import deleteChatActionAtom from '../../../state/chat/atoms/deleteChatActionAtom'
import blockChatActionAtom from '../../../state/chat/atoms/blockChatActionAtom'
import * as TE from 'fp-ts/TaskEither'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/function'
import {loadingOverlayDisplayedAtom} from '../../LoadingOverlayProvider'
import {Alert} from 'react-native'
import randomName from '../../../utils/randomName'
import selectOtherSideDataAtom from '../../../state/chat/atoms/selectOtherSideDataAtom'
import focusOtherSideLeftAtom from '../../../state/chat/atoms/focusOtherSideLeftAtom'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import {deleteChatStep1Svg} from '../images/deleteChatSvg'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import revealIdentityActionAtom, {
  type RevealMessageType,
} from '../../../state/chat/atoms/revealIdentityActionAtom'
import reportError from '../../../utils/reportError'
import connectionStateAtom, {
  createFriendLevelInfoAtom,
} from '../../../state/connections/atom/connectionStateAtom'
import {type FriendLevel} from '@vexl-next/domain/dist/general/offers'
import {type UriString} from '@vexl-next/domain/dist/utility/UriString.brand'
import createIsCancelledAtom from '../../../state/chat/atoms/createIsCancelledAtom'
import {createRequestStateAtom} from '../../../state/chat/atoms/createRequestStateAtom'
import createCanChatBeRerequestedAtom from '../../../state/chat/atoms/createCanBeRerequestedAtom'
import {sendRequestHandleUIActionAtom} from '../../../state/chat/atoms/sendRequestActionAtom'
import cancelRequestActionAtomHandleUI from '../../../state/chat/atoms/cancelRequestActionAtomHandleUI'
import {safeNavigateBackOutsideReact} from '../../../utils/navigation'
import {type SelectedImage} from '../../../utils/imagePickers'
import getValueFromSetStateActionOfAtom from '../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import revealContactActionAtom, {
  type RevealContactMessageType,
} from '../../../state/chat/atoms/revealContactActionAtom'
import showErrorAlert from '../../../utils/showErrorAlert'

type ChatUIMode = 'approval' | 'messages'

export const dummyChatWithMessages: ChatWithMessages = {
  chat: {
    id: generateChatId(),
    inbox: {privateKey: generatePrivateKey()},
    otherSide: {publicKey: generatePrivateKey().publicKeyPemBase64},
    origin: {type: 'unknown'},
    isUnread: false,
    showInfoBar: true,
    feedbackDone: false,
  },
  messages: [],
}

export type ExtraToSend =
  | {type: 'image'; image: SelectedImage}
  | {type: 'reply'; message: ChatMessageWithState}

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

  const commonConnectionsHashesAtom = atom((get) => {
    const offer = get(offerForChatAtom)
    const chat = get(chatAtom)
    const connectionState = get(connectionStateAtom)
    return offer?.ownershipInfo
      ? connectionState.commonFriends.commonContacts.find(
          (contact) => contact.publicKey === chat.otherSide.publicKey
        )?.common.hashes ?? []
      : offer?.offerInfo.privatePart.commonFriends ?? []
  })

  const commonConnectionsCountAtom = selectAtom(
    commonConnectionsHashesAtom,
    (connections) => connections.length
  )

  const deleteChatWithUiFeedbackAtom = atom(
    null,
    async (get, set, {skipAsk}: {skipAsk: boolean} = {skipAsk: false}) => {
      const {t} = get(translationAtom)
      return await pipe(
        skipAsk
          ? TE.right([{type: 'noResult'}])
          : set(askAreYouSureActionAtom, {
              steps: [
                {
                  type: 'StepWithText',
                  image: {
                    type: 'svgXml',
                    svgXml: deleteChatStep1Svg,
                  },
                  title: t('messages.deleteChatQuestion'),
                  description: t('messages.deleteChatExplanation1'),
                  negativeButtonText: t('common.back'),
                  positiveButtonText: t('common.yesDelete'),
                },
                {
                  type: 'StepWithText',
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

            if (e._tag === 'UserDeclinedError') {
              return false
            }
            showErrorAlert({
              title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
              error: e,
            })
            return false
          },
          () => {
            set(loadingOverlayDisplayedAtom, false)
            return true
          }
        )
      )()
    }
  )

  const blockChatAtom = blockChatActionAtom(chatWithMessagesAtom)
  const blockChatWithUiFeedbackAtom = atom(null, async (get, set) => {
    const {t} = get(translationAtom)

    return await pipe(
      set(askAreYouSureActionAtom, {
        steps: [
          {
            type: 'StepWithText',
            image: {
              type: 'requiredImage',
              image: require('../images/blockChat1.png'),
            },
            title: t('messages.blockForewerQuestion'),
            description: t('messages.blockChatExplanation1'),
            negativeButtonText: t('common.nope'),
            positiveButtonText: t('messages.yesBlock'),
          },
          {
            type: 'StepWithText',
            image: {
              type: 'requiredImage',
              image: require('../images/blockChat1.png'),
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
          if (e._tag === 'UserDeclinedError') {
            return false
          }

          showErrorAlert({
            title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
            error: e,
          })
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
  const receivedContactRevealRequestMessageAtom = selectAtom(
    messagesAtom,
    (messages) =>
      messages.find(
        (message) =>
          message.message.messageType === 'REQUEST_CONTACT_REVEAL' &&
          message.state === 'received'
      )
  )

  const forceShowHistoryAtom = atom(false)

  const chatUiModeAtom = atom<ChatUIMode>((get) => {
    const forceShowHistory = get(forceShowHistoryAtom)
    if (forceShowHistory) return 'messages'

    const messages = get(messagesAtom)

    const lastMessage = messages.at(-1)

    if (
      [
        'CANCEL_REQUEST_MESSAGING',
        'REQUEST_MESSAGING',
        'DISAPPROVE_MESSAGING',
      ].includes(lastMessage?.message.messageType ?? '')
    )
      return 'approval'

    if (
      lastMessage?.message.messageType === 'DELETE_CHAT' &&
      lastMessage.state === 'sent'
    )
      return 'approval'

    return 'messages'
  })

  const canSendMessagesAtom = selectAtom(messagesAtom, (o) => {
    const lastMessage = o.at(-1)

    return !(
      (lastMessage?.state === 'received' &&
        lastMessage.message.messageType === 'INBOX_DELETED') ||
      lastMessage?.message.messageType === 'DELETE_CHAT' ||
      lastMessage?.message.messageType === 'REQUEST_MESSAGING' ||
      lastMessage?.message.messageType === 'CANCEL_REQUEST_MESSAGING' ||
      lastMessage?.message.messageType === 'DISAPPROVE_MESSAGING' ||
      lastMessage?.message.messageType === 'BLOCK_CHAT'
    )
  })

  const revealIdentityAtom = revealIdentityActionAtom(chatWithMessagesAtom)
  const revealContactAtom = revealContactActionAtom(chatWithMessagesAtom)

  const openedImageUriAtom = atom<UriString | undefined>(undefined)

  const revealIdentityWithUiFeedbackAtom = atom(
    null,
    async (get, set, type: 'REQUEST_REVEAL' | 'RESPOND_REVEAL') => {
      const {t} = get(translationAtom)

      const modalContent = (() => {
        if (type === 'REQUEST_REVEAL') {
          return {
            title: t('messages.identityRevealRequestModal.title'),
            description: t('messages.identityRevealRequestModal.text'),
            negativeButtonText: t('common.back'),
            positiveButtonText: t('messages.identityRevealRequestModal.send'),
          }
        }
        return {
          title: t('messages.identityRevealRespondModal.title'),
          description: t('messages.identityRevealRespondModal.text'),
          negativeButtonText: t('common.no'),
          positiveButtonText: t('common.yes'),
        }
      })()

      return await pipe(
        set(askAreYouSureActionAtom, {
          steps: [{...modalContent, type: 'StepWithText'}],
          variant: 'info',
        }),
        TE.map((val) => {
          set(loadingOverlayDisplayedAtom, true)
          return val
        }),
        TE.match(
          (e) => {
            if (e._tag === 'UserDeclinedError' && type === 'RESPOND_REVEAL') {
              return E.right('DISAPPROVE_REVEAL' as RevealMessageType)
            }
            return E.left(e)
          },
          () =>
            E.right(
              type === 'RESPOND_REVEAL'
                ? ('APPROVE_REVEAL' as RevealMessageType)
                : ('REQUEST_REVEAL' as RevealMessageType)
            )
        ),
        TE.chainW((type) => set(revealIdentityAtom, {type})),
        TE.match(
          (e) => {
            set(loadingOverlayDisplayedAtom, false)
            if (e._tag === 'UserDeclinedError') {
              return false
            }
            if (e._tag === 'IdentityRequestAlreadySentError') {
              showErrorAlert({
                title: t('messages.identityAlreadyRequested'),
                error: e,
              })

              return false
            }
            if (e._tag !== 'NetworkError')
              reportError('error', 'Error sending identityReveal', e)
            showErrorAlert({
              title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
              error: e,
            })
            return false
          },
          () => {
            set(loadingOverlayDisplayedAtom, false)
            return true
          }
        )
      )()
    }
  )

  const revealContactWithUiFeedbackAtom = atom(
    null,
    async (get, set, type: 'REQUEST_REVEAL' | 'RESPOND_REVEAL') => {
      const {t} = get(translationAtom)

      const modalContent = (() => {
        if (type === 'REQUEST_REVEAL') {
          return {
            title: t('messages.contactRevealRequestModal.title'),
            description: t('messages.contactRevealRequestModal.text'),
            negativeButtonText: t('common.back'),
            positiveButtonText: t('common.sendRequest'),
          }
        }
        return {
          title: t('messages.contactRevealRespondModal.title'),
          description: t('messages.contactRevealRespondModal.text'),
          negativeButtonText: t('common.no'),
          positiveButtonText: t('common.yes'),
        }
      })()

      return await pipe(
        set(askAreYouSureActionAtom, {
          steps: [{...modalContent, type: 'StepWithText'}],
          variant: 'info',
        }),
        TE.map((val) => {
          set(loadingOverlayDisplayedAtom, true)
          return val
        }),
        TE.match(
          (e) => {
            if (e._tag === 'UserDeclinedError' && type === 'RESPOND_REVEAL') {
              return E.right(
                'DISAPPROVE_CONTACT_REVEAL' as RevealContactMessageType
              )
            }
            return E.left(e)
          },
          () =>
            E.right(
              type === 'RESPOND_REVEAL'
                ? ('APPROVE_CONTACT_REVEAL' as RevealContactMessageType)
                : ('REQUEST_CONTACT_REVEAL' as RevealContactMessageType)
            )
        ),
        TE.chainW((type) => set(revealContactAtom, {type})),
        TE.match(
          (e) => {
            set(loadingOverlayDisplayedAtom, false)

            if (e._tag === 'UserDeclinedError') {
              return false
            }
            if (e._tag === 'ContactRevealRequestAlreadySentError') {
              showErrorAlert({
                title: t('messages.contactAlreadyRequested'),
                error: e,
              })
              return false
            }
            if (e._tag !== 'NetworkError')
              reportError('error', 'Error sending contact reveal', e)
            showErrorAlert({
              title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
              error: e,
            })
            return false
          },
          () => {
            set(loadingOverlayDisplayedAtom, false)
            return true
          }
        )
      )()
    }
  )

  const identityRevealStatusAtom = selectAtom(
    chatWithMessagesAtom,
    ({
      messages,
    }): 'shared' | 'denied' | 'iAsked' | 'theyAsked' | 'notStarted' => {
      const response = messages.find(
        (one) =>
          one.message.messageType === 'DISAPPROVE_REVEAL' ||
          one.message.messageType === 'APPROVE_REVEAL'
      )
      if (response)
        return response.message.messageType === 'APPROVE_REVEAL'
          ? 'shared'
          : 'denied' // no need to search further

      const requestMessage = messages.find(
        (one) => one.message.messageType === 'REQUEST_REVEAL'
      )

      if (requestMessage)
        return requestMessage.state === 'received' ? 'theyAsked' : 'iAsked'

      return 'notStarted'
    }
  )

  const contactRevealStatusAtom = selectAtom(
    chatWithMessagesAtom,
    ({
      messages,
    }): 'shared' | 'denied' | 'iAsked' | 'theyAsked' | 'notStarted' => {
      const response = messages.find(
        (one) =>
          one.message.messageType === 'DISAPPROVE_CONTACT_REVEAL' ||
          one.message.messageType === 'APPROVE_CONTACT_REVEAL'
      )
      if (response)
        return response.message.messageType === 'APPROVE_CONTACT_REVEAL'
          ? 'shared'
          : 'denied' // no need to search further

      const requestMessage = messages.find(
        (one) => one.message.messageType === 'REQUEST_CONTACT_REVEAL'
      )

      if (requestMessage)
        return requestMessage.state === 'received' ? 'theyAsked' : 'iAsked'

      return 'notStarted'
    }
  )

  const friendLevelOfOtherSidePublicKeyAtom = atom((get) => {
    return get(createFriendLevelInfoAtom(get(chatAtom).otherSide.publicKey))
  })

  const friendLevelInfoAtom = atom<FriendLevel[]>((get) => {
    const originOffer = get(offerForChatAtom)

    if (originOffer?.ownershipInfo?.adminId) {
      // if this is my offer, we can look up user from connection state. The public
      // key of the user is public key to his contact
      return get(friendLevelOfOtherSidePublicKeyAtom)
    }
    return originOffer?.offerInfo.privatePart?.friendLevel ?? []
  })

  // const replyToMessageAtom = atom<ChatMessageWithState | null>(null)
  const messageOptionsExtendedAtom = atom<ChatMessageWithState | null>(null)

  const theirOfferAndNotReportedAtom = selectAtom(
    offerForChatAtom,
    (offer) => !offer?.ownershipInfo && !offer?.flags.reported
  )

  const showOfferDeletedWithOptionToDeleteActionAtom = atom(
    null,
    (get, set) => {
      const t = get(translationAtom).t
      Alert.alert(
        t('messages.unableToRespondOfferRemoved.title'),
        t('messages.unableToRespondOfferRemoved.text'),
        [
          {
            text: t('common.back'),
            style: 'cancel',
          },
          {
            text: t('messages.deleteChat'),
            onPress: () => {
              void set(deleteChatWithUiFeedbackAtom, {skipAsk: true}).then(
                (success) => {
                  if (success) {
                    safeNavigateBackOutsideReact()
                  }
                }
              )
            },
          },
        ]
      )
    }
  )

  const rerequestOfferActionAtom = atom(
    null,
    (get, set, {text}: {text: string}) => {
      const offer = get(offerForChatAtom)
      if (!offer) {
        set(showOfferDeletedWithOptionToDeleteActionAtom)
        return T.of(false)
      }

      return pipe(
        set(sendRequestHandleUIActionAtom, {text, originOffer: offer}),
        TE.match(
          () => false,
          () => true
        )
      )
    }
  )

  const hasPreviousCommunicationAtom = selectAtom(
    messagesAtom,
    (
      messages
    ):
      | 'firstInteraction'
      | 'anotherInteractionWithHistory'
      | 'interactionAfterDelete' => {
      if (messages.length === 0) return 'firstInteraction'

      const hasOnlyOneRequest =
        messages.filter(
          (one) => one.message.messageType === 'REQUEST_MESSAGING'
        ).length === 1
      const wasDeleted = messages.at(0)?.message.messageType === 'DELETE_CHAT'

      if (hasOnlyOneRequest)
        return wasDeleted ? 'interactionAfterDelete' : 'firstInteraction'
      return 'anotherInteractionWithHistory'
    }
  )

  const cancelRequestActionAtom = atom(null, (get, set) => {
    const offerInfo = get(offerForChatAtom)?.offerInfo
    if (!offerInfo) {
      set(showOfferDeletedWithOptionToDeleteActionAtom)
      return
    }

    return pipe(
      set(cancelRequestActionAtomHandleUI, {
        text: '',
        originOffer: offerInfo,
      }),
      TE.match(
        () => false,
        () => true
      )
    )()
  })

  const selectedExtraToSendAtom = atom<ExtraToSend | undefined>(undefined)
  const selectedImageAtom: PrimitiveAtom<SelectedImage | undefined> = atom(
    (get) => {
      const extra = get(selectedExtraToSendAtom)
      if (extra?.type === 'image') return extra.image
      return undefined
    },
    (
      get,
      set,
      imageSetStateAction: SetStateAction<SelectedImage | undefined>
    ) => {
      const newValue = getValueFromSetStateActionOfAtom(imageSetStateAction)(
        () => get(selectedImageAtom)
      )
      set(
        selectedExtraToSendAtom,
        newValue ? {type: 'image', image: newValue} : undefined
      )
    }
  )
  const replyToMessageAtom: PrimitiveAtom<ChatMessageWithState | undefined> =
    atom(
      (get) => {
        const extra = get(selectedExtraToSendAtom)
        if (extra?.type === 'reply') return extra.message
        return undefined
      },
      (
        get,
        set,
        messageSetStateAction: SetStateAction<ChatMessageWithState | undefined>
      ) => {
        const newValue = getValueFromSetStateActionOfAtom(
          messageSetStateAction
        )(() => get(replyToMessageAtom))
        set(
          selectedExtraToSendAtom,
          newValue ? {type: 'reply', message: newValue} : undefined
        )
      }
    )

  const clearExtraToSendActionAtom = atom(null, (get, set) => {
    set(selectedExtraToSendAtom, undefined)
  })

  const showInfoBarAtom = focusAtom(chatAtom, (o) => o.prop('showInfoBar'))

  const feedbackDoneAtom = focusAtom(chatAtom, (o) => o.prop('feedbackDone'))

  return {
    showModalAtom: atom<boolean>(false),
    chatAtom,
    nameAtom,
    chatWithMessagesAtom,
    commonConnectionsHashesAtom,
    commonConnectionsCountAtom,
    messagesAtom,
    messageAtomAtoms,
    offerForChatAtom,
    chatUiModeAtom,
    sendMessageAtom: sendMessageActionAtom(chatWithMessagesAtom),
    requestMessageAtom: focusRequestMessageAtom(chatWithMessagesAtom),
    wasDeniedAtom: focusWasDeniedAtom(chatWithMessagesAtom),
    wasCancelledAtom: createIsCancelledAtom(chatWithMessagesAtom),
    otherSideDataAtom: selectOtherSideDataAtom(chatAtom),
    otherSideLeftAtom: focusOtherSideLeftAtom(chatWithMessagesAtom),
    identityRevealStatusAtom,
    contactRevealStatusAtom,
    revealIdentityWithUiFeedbackAtom,
    revealContactWithUiFeedbackAtom,
    deleteChatWithUiFeedbackAtom,
    blockChatWithUiFeedbackAtom,
    messagesListAtomAtoms,
    lastMessageAtom,
    canSendMessagesAtom,
    friendLevelInfoAtom,
    replyToMessageAtom,
    messageOptionsExtendedAtom,
    theirOfferAndNotReportedAtom,
    openedImageUriAtom,
    forceShowHistoryAtom,
    requestStateAtom: createRequestStateAtom(chatWithMessagesAtom),
    canBeRerequestedAtom: createCanChatBeRerequestedAtom(chatWithMessagesAtom),
    rerequestOfferActionAtom,
    hasPreviousCommunicationAtom,
    cancelRequestActionAtom,
    selectedImageAtom,
    clearExtraToSendActionAtom,
    receivedContactRevealRequestMessageAtom,
    showInfoBarAtom,
    feedbackDoneAtom,
  }
})
