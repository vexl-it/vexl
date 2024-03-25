import {type FriendLevel} from '@vexl-next/domain/src/general/offers'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {createScope, molecule} from 'bunshi/dist/react'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {
  atom,
  type PrimitiveAtom,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {selectAtom, splitAtom} from 'jotai/utils'
import {DateTime} from 'luxon'
import {Alert} from 'react-native'
import blockChatActionAtom from '../../../state/chat/atoms/blockChatActionAtom'
import cancelRequestActionAtomHandleUI from '../../../state/chat/atoms/cancelRequestActionAtomHandleUI'
import createCanChatBeRerequestedAtom from '../../../state/chat/atoms/createCanBeRerequestedAtom'
import createIsCancelledAtom from '../../../state/chat/atoms/createIsCancelledAtom'
import {createOtherSideSupportsTradingChecklistAtom} from '../../../state/chat/atoms/createOtherSideSupportTradingChecklistAtom'
import {createRequestStateAtom} from '../../../state/chat/atoms/createRequestStateAtom'
import deleteChatActionAtom from '../../../state/chat/atoms/deleteChatActionAtom'
import {focusWasDeniedAtom} from '../../../state/chat/atoms/focusDenyRequestMessageAtom'
import focusOtherSideLeftAtom from '../../../state/chat/atoms/focusOtherSideLeftAtom'
import focusRequestMessageAtom from '../../../state/chat/atoms/focusRequestMessageAtom'
import revealContactActionAtom, {
  type RevealContactMessageType,
} from '../../../state/chat/atoms/revealContactActionAtom'
import revealIdentityActionAtom from '../../../state/chat/atoms/revealIdentityActionAtom'
import selectOtherSideDataAtom from '../../../state/chat/atoms/selectOtherSideDataAtom'
import sendMessageActionAtom from '../../../state/chat/atoms/sendMessageActionAtom'
import {sendRequestHandleUIActionAtom} from '../../../state/chat/atoms/sendRequestActionAtom'
import {
  dummyChatWithMessages,
  type ChatMessageWithState,
  type ChatWithMessages,
} from '../../../state/chat/domain'
import connectionStateAtom, {
  createFriendLevelInfoAtom,
} from '../../../state/connections/atom/connectionStateAtom'
import {createBtcPriceForCurrencyAtom} from '../../../state/currentBtcPriceAtoms'
import {createFeedbackForChatAtom} from '../../../state/feedback/atoms'
import {offerForChatOriginAtom} from '../../../state/marketplace/atoms/offersState'
import {invalidUsernameUIFeedbackAtom} from '../../../state/session'
import {otherSideDataAtom} from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import {getAmountData} from '../../../state/tradeChecklist/utils/amount'
import * as dateAndTime from '../../../state/tradeChecklist/utils/dateAndTime'
import * as MeetingLocation from '../../../state/tradeChecklist/utils/location'
import getValueFromSetStateActionOfAtom from '../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {
  createCalendarEvent,
  createCalendarIfNotExistsAndTryToResolvePermissionsAlongTheWayActionAtom,
} from '../../../utils/calendar'
import {type SelectedImage} from '../../../utils/imagePickers'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {safeNavigateBackOutsideReact} from '../../../utils/navigation'
import randomName from '../../../utils/randomName'
import reportError from '../../../utils/reportError'
import showErrorAlert from '../../../utils/showErrorAlert'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {askAreYouSureActionAtom} from '../../AreYouSureDialog'
import {loadingOverlayDisplayedAtom} from '../../LoadingOverlayProvider'
import {revealIdentityDialogUIAtom} from '../../RevealIdentityDialog/atoms'
import ChatFeedbackDialogContent from '../components/ChatFeedbackDialogContent'
import {deleteChatStep1Svg} from '../images/deleteChatSvg'
import buildMessagesListData from '../utils/buildMessagesListData'

type ChatUIMode = 'approval' | 'messages'

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

  const offerCurrencyAtom = atom((get) => {
    const offerForChat = get(offerForChatAtom)
    return offerForChat?.offerInfo?.publicPart?.currency ?? 'USD'
  })

  const tradeChecklistAtom = focusAtom(chatWithMessagesAtom, (o) =>
    o.prop('tradeChecklist')
  )

  const messagesListDataAtom = atom((get) =>
    buildMessagesListData(get(messagesAtom), get(tradeChecklistAtom))
  )
  const messagesListAtomAtoms = splitAtom(messagesListDataAtom)

  const deleteChatAtom = deleteChatActionAtom(chatWithMessagesAtom)

  const nameAtom = selectAtom(chatAtom, (o) => randomName(o.id))
  const chatIdAtom = focusAtom(chatAtom, (o) => o.prop('id'))
  const publicKeyPemBase64Atom = focusAtom(chatAtom, (o) =>
    o.prop('inbox').prop('privateKey').prop('publicKeyPemBase64')
  )

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
      const deniedMessaging = get(focusWasDeniedAtom(chatWithMessagesAtom))

      const feedbackFinished = get(chatFeedbackAtom).finished

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

            if (!feedbackFinished && !deniedMessaging)
              void set(giveFeedbackForDeletedChatAtom)

            return true
          }
        )
      )()
    }
  )

  const chatFeedbackAtom = createFeedbackForChatAtom(
    atom((get) => get(chatAtom).id)
  )

  const giveFeedbackForDeletedChatAtom = atom(null, async (get, set) => {
    const {t} = get(translationAtom)
    const chatFeedback = get(chatFeedbackAtom)

    if (!chatFeedback.finished) {
      await pipe(
        set(askAreYouSureActionAtom, {
          steps: [
            {
              type: 'StepWithChildren',
              MainSectionComponent: ChatFeedbackDialogContent,
              positiveButtonText: t('common.close'),
              backgroundColor: '$grey',
            },
          ],
          variant: 'info',
        }),
        TE.match(
          () => {},
          () => {}
        )
      )()
    }
  })

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

  const revealIdentityUsernameAtom = atom<string>('')
  const usernameSavedForFutureUseAtom = atom<boolean>(false)
  const revealIdentityImageUriAtom = atom<UriString | undefined>(undefined)
  const imageSavedForFutureUseAtom = atom<boolean>(false)

  const openedImageUriAtom = atom<UriString | undefined>(undefined)

  const revealIdentityWithUiFeedbackAtom = atom(
    null,
    async (get, set, type: 'REQUEST_REVEAL' | 'RESPOND_REVEAL') => {
      const {t} = get(translationAtom)

      return await pipe(
        set(revealIdentityDialogUIAtom, {
          type,
          revealIdentityUsernameAtom,
          usernameSavedForFutureUseAtom,
          revealIdentityImageUriAtom,
          imageSavedForFutureUseAtom,
        }),
        TE.chainW(({type, username, imageUri}) =>
          set(revealIdentityAtom, {type, username, imageUri})
        ),
        TE.match(
          (e) => {
            set(loadingOverlayDisplayedAtom, false)
            if (e._tag === 'UserDeclinedError') {
              return false
            }

            if (e._tag === 'UsernameEmptyError') {
              void set(invalidUsernameUIFeedbackAtom)

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
              reportError('error', new Error('Error sending identityReveal'), {
                e,
              })
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
              reportError('error', new Error('Error sending contact reveal'), {
                e,
              })
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
      tradeChecklist,
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

      // check also tradeChecklist for identity reveal messages
      if (
        tradeChecklist.identity.received?.status === 'APPROVE_REVEAL' ||
        tradeChecklist.identity.sent?.status === 'APPROVE_REVEAL'
      )
        return 'shared'
      if (
        tradeChecklist.identity.received?.status === 'DISAPPROVE_REVEAL' ||
        tradeChecklist.identity.sent?.status === 'DISAPPROVE_REVEAL'
      )
        return 'denied'

      const requestMessage = messages.find(
        (one) => one.message.messageType === 'REQUEST_REVEAL'
      )

      if (requestMessage)
        return requestMessage.state === 'received' ? 'theyAsked' : 'iAsked'

      // check also tradeChecklist for identity reveal messages
      if (tradeChecklist.identity.received?.status === 'REQUEST_REVEAL')
        return 'theyAsked'
      if (tradeChecklist.identity.sent?.status === 'REQUEST_REVEAL')
        return 'iAsked'

      return 'notStarted'
    }
  )

  const identityRevealTriggeredFromTradeChecklistAtom = atom((get) => {
    const chatWithMessages = get(chatWithMessagesAtom)

    return (
      chatWithMessages.tradeChecklist.identity.received?.status ===
      'REQUEST_REVEAL'
    )
  })

  const contactRevealTriggeredFromTradeChecklistAtom = atom((get) => {
    const chatWithMessages = get(chatWithMessagesAtom)

    return (
      chatWithMessages.tradeChecklist.contact.received?.status ===
      'REQUEST_REVEAL'
    )
  })

  const contactRevealStatusAtom = selectAtom(
    chatWithMessagesAtom,
    ({
      messages,
      tradeChecklist,
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

      // check also tradeChecklist for contact reveal messages
      if (
        tradeChecklist.contact.received?.status === 'APPROVE_REVEAL' ||
        tradeChecklist.contact.sent?.status === 'APPROVE_REVEAL'
      )
        return 'shared'
      if (
        tradeChecklist.contact.received?.status === 'DISAPPROVE_REVEAL' ||
        tradeChecklist.contact.sent?.status === 'DISAPPROVE_REVEAL'
      )
        return 'denied'

      const requestMessage = messages.find(
        (one) => one.message.messageType === 'REQUEST_CONTACT_REVEAL'
      )

      if (requestMessage)
        return requestMessage.state === 'received' ? 'theyAsked' : 'iAsked'

      // check also tradeChecklist for contact reveal messages
      if (tradeChecklist.contact.received?.status === 'REQUEST_REVEAL')
        return 'theyAsked'
      if (tradeChecklist.contact.sent?.status === 'REQUEST_REVEAL')
        return 'iAsked'

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

  const calendarEventIdAtom = focusAtom(chatAtom, (o) =>
    o.prop('tradeChecklistCalendarEventId')
  )

  const showVexlbotNotificationsForCurrentChatAtom = focusAtom(chatAtom, (o) =>
    o.prop('showVexlbotNotifications')
  )
  const showVexlbotInitialMessageForCurrentChatAtom = focusAtom(chatAtom, (o) =>
    o.prop('showVexlbotInitialMessage')
  )

  const tradeChecklistDateAndTimeAtom = focusAtom(tradeChecklistAtom, (o) =>
    o.prop('dateAndTime')
  )

  const tradeChecklistNetworkAtom = focusAtom(tradeChecklistAtom, (o) =>
    o.prop('network')
  )

  const tradeChecklistAmountAtom = focusAtom(tradeChecklistAtom, (o) =>
    o.prop('amount')
  )

  const tradeChecklistIdentityRevealAtom = focusAtom(tradeChecklistAtom, (o) =>
    o.prop('identity')
  )

  const tradeChecklistContactRevealAtom = focusAtom(tradeChecklistAtom, (o) =>
    o.prop('contact')
  )

  const tradeChecklistMeetingLocationAtom = focusAtom(tradeChecklistAtom, (o) =>
    o.prop('location')
  )

  const shouldHideNetworkCellForTradeChecklistAtom = atom((get) => {
    const offerForChat = get(offerForChatAtom)

    return (
      (!!offerForChat?.ownershipInfo &&
        offerForChat?.offerInfo.publicPart.offerType === 'SELL') ||
      (!offerForChat?.ownershipInfo &&
        offerForChat?.offerInfo.publicPart.offerType === 'BUY')
    )
  })

  const tradeOrOriginOfferCurrencyAtom = atom((get) => {
    const originOffer = get(offerForChatAtom)
    const tradeChecklistAmountData = getAmountData(
      get(tradeChecklistAmountAtom)
    )

    return (
      tradeChecklistAmountData?.amountData.currency ??
      originOffer?.offerInfo?.publicPart?.currency ??
      'USD'
    )
  })

  const btcPriceForTradeCurrencyAtom = createBtcPriceForCurrencyAtom(
    tradeOrOriginOfferCurrencyAtom
  )

  const isDateAndTimePickedAtom = atom((get) => {
    const dateAndTimeData = get(tradeChecklistDateAndTimeAtom)
    const pick = dateAndTime.getPick(dateAndTimeData)

    return !!pick
  })

  const addEventToCalendarActionAtom = atom(
    null,
    (get, set): T.Task<boolean> => {
      const {t} = get(translationAtom)
      const calendarEventId = get(calendarEventIdAtom)
      const agreedOn = MeetingLocation.getAgreed(
        get(tradeChecklistMeetingLocationAtom)
      )
      const dateAndTimeData = get(tradeChecklistDateAndTimeAtom)
      const pick = dateAndTime.getPick(dateAndTimeData)

      if (!pick) return T.of(false)

      const event = {
        startDate: DateTime.fromMillis(pick.pick.dateTime).toJSDate(),
        endDate: DateTime.fromMillis(pick.pick.dateTime).toJSDate(),
        title: t('tradeChecklist.vexlMeetingEventTitle', {
          name: get(otherSideDataAtom).userName,
        }),
        location: agreedOn?.data.data?.address,
        notes: agreedOn?.data.data.note ?? '',
      }

      set(loadingOverlayDisplayedAtom, true)

      return pipe(
        TE.Do,
        TE.bindW('calendarId', () =>
          set(
            createCalendarIfNotExistsAndTryToResolvePermissionsAlongTheWayActionAtom
          )
        ),
        (a) => a,
        TE.bindW('createEventActionResult', ({calendarId}) =>
          createCalendarEvent({
            calendarEventId,
            calendarId,
            event,
          })
        ),
        TE.chainFirstW(({createEventActionResult: {action}}) =>
          set(askAreYouSureActionAtom, {
            steps: [
              {
                type: 'StepWithText',
                title:
                  action === 'created'
                    ? t('tradeChecklist.eventAddedSuccess')
                    : t('tradeChecklist.eventEditSuccess'),
                description:
                  action === 'created'
                    ? t('tradeChecklist.eventAddedSuccessDescription')
                    : t('tradeChecklist.eventEditSuccessDescription'),
                positiveButtonText: t('common.close'),
              },
            ],
            variant: 'info',
          })
        ),
        TE.match(
          (e) => {
            set(loadingOverlayDisplayedAtom, false)
            if (e._tag === 'permissionsNotGranted') {
              Alert.alert(t('tradeChecklist.calendarPermissionsNotGranted'))
            }

            if (e._tag === 'unknown') {
              reportError('error', new Error('Error creating calendar event'), {
                e,
              })

              showErrorAlert({
                title: toCommonErrorMessage(e, t) ?? t('common.unknownError'),
                error: e,
              })
            }

            return false
          },
          ({createEventActionResult: {calendarEventId}}) => {
            set(loadingOverlayDisplayedAtom, false)
            set(calendarEventIdAtom, calendarEventId)
            return true
          }
        )
      )
    }
  )

  const listingTypeIsOtherAtom = atom((get) => {
    const offerForChat = get(offerForChatAtom)
    return offerForChat?.offerInfo?.publicPart?.listingType === 'OTHER'
  })

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
    otherSideSupportsTradingChecklistAtom:
      createOtherSideSupportsTradingChecklistAtom(chatAtom),
    rerequestOfferActionAtom,
    hasPreviousCommunicationAtom,
    cancelRequestActionAtom,
    selectedImageAtom,
    clearExtraToSendActionAtom,
    showInfoBarAtom,
    chatFeedbackAtom,
    showVexlbotNotificationsForCurrentChatAtom,
    showVexlbotInitialMessageForCurrentChatAtom,
    publicKeyPemBase64Atom,
    chatIdAtom,
    tradeChecklistAtom,
    tradeChecklistDateAndTimeAtom,
    tradeChecklistNetworkAtom,
    tradeChecklistAmountAtom,
    offerCurrencyAtom,
    tradeChecklistIdentityRevealAtom,
    tradeChecklistContactRevealAtom,
    identityRevealTriggeredFromTradeChecklistAtom,
    contactRevealTriggeredFromTradeChecklistAtom,
    tradeChecklistMeetingLocationAtom,
    shouldHideNetworkCellForTradeChecklistAtom,
    tradeOrOriginOfferCurrencyAtom,
    btcPriceForTradeCurrencyAtom,
    calendarEventIdAtom,
    isDateAndTimePickedAtom,
    addEventToCalendarActionAtom,
    listingTypeIsOtherAtom,
  }
})
