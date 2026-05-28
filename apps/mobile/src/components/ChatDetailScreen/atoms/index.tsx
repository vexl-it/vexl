import {type ViewToken} from '@shopify/flash-list'
import {
  type ChatMessageId,
  type MessageType,
} from '@vexl-next/domain/src/general/messaging'
import {type FriendLevel} from '@vexl-next/domain/src/general/offers'
import {toBasicError} from '@vexl-next/domain/src/utility/errors'
import {
  effectToTaskEither,
  taskEitherToEffect,
} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {createScope, molecule} from 'bunshi/dist/react'
import {Array, Effect, Either, HashSet, Option, pipe} from 'effect'
import * as E from 'fp-ts/Either'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {
  atom,
  type Atom,
  type PrimitiveAtom,
  type SetStateAction,
  type WritableAtom,
} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {selectAtom, splitAtom} from 'jotai/utils'
import {DateTime} from 'luxon'
import {Alert} from 'react-native'
import acceptMessagingRequestAtom from '../../../state/chat/atoms/acceptMessagingRequestAtom'
import cancelRequestActionAtomHandleUI from '../../../state/chat/atoms/cancelRequestActionAtomHandleUI'
import createCanChatBeRerequestedAtom from '../../../state/chat/atoms/createCanBeRerequestedAtom'
import {createCanSendMessagesAtom} from '../../../state/chat/atoms/createCanSendMessagesAtom'
import {createOtherSideSupportsTradingChecklistAtom} from '../../../state/chat/atoms/createOtherSideSupportTradingChecklistAtom'
import {createRequestStateAtom} from '../../../state/chat/atoms/createRequestStateAtom'
import deleteChatActionAtom from '../../../state/chat/atoms/deleteChatActionAtom'
import {focusWasDeniedAtom} from '../../../state/chat/atoms/focusDenyRequestMessageAtom'
import focusOtherSideLeftAtom from '../../../state/chat/atoms/focusOtherSideLeftAtom'
import revealContactActionAtom, {
  type RevealContactMessageType,
} from '../../../state/chat/atoms/revealContactActionAtom'
import revealIdentityActionAtom from '../../../state/chat/atoms/revealIdentityActionAtom'
import selectOtherSideDataAtom from '../../../state/chat/atoms/selectOtherSideDataAtom'
import sendMessageActionAtom from '../../../state/chat/atoms/sendMessageActionAtom'
import {
  dummyChatWithMessages,
  type ChatMessageWithState,
  type ChatTransientMessageId,
  type ChatWithMessages,
} from '../../../state/chat/domain'
import {getChatState} from '../../../state/chat/utils/offerStates'
import {createBtcPriceForCurrencyAtom} from '../../../state/currentBtcPriceAtoms'
import {offerForChatOriginAtom} from '../../../state/marketplace/atoms/offersState'
import * as amount from '../../../state/tradeChecklist/utils/amount'
import {getLatestAmountDataMessage} from '../../../state/tradeChecklist/utils/amount'
import * as dateAndTime from '../../../state/tradeChecklist/utils/dateAndTime'
import getContactRevealStatus from '../../../state/tradeChecklist/utils/getContactRevealStatus'
import getIdentityRevealStatus from '../../../state/tradeChecklist/utils/getIdentityRevealStatus'
import * as MeetingLocation from '../../../state/tradeChecklist/utils/location'
import {andThenExpectBooleanNoErrors} from '../../../utils/andThenExpectNoErrors'
import getValueFromSetStateActionOfAtom from '../../../utils/atomUtils/getValueFromSetStateActionOfAtom'
import {
  createCalendarEvent,
  createCalendarIfNotExistsAndTryToResolvePermissionsAlongTheWayActionAtom,
} from '../../../utils/calendar'
import {type SelectedImage} from '../../../utils/imagePickers'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {
  navigationRef,
  safeNavigateBackOutsideReact,
} from '../../../utils/navigation'
import reportError from '../../../utils/reportError'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import showDonationPromptGiveLoveActionAtom from '../../DonationPrompt/atoms/showDonationPromptGiveLoveActionAtom'
import {showErrorAlert} from '../../ErrorAlert'
import {globalDialogAtom} from '../../GlobalDialog'
import {loadingOverlayDisplayedAtom} from '../../LoadingOverlayProvider'
import {showUserFeedbackDialogAtom} from '../../UserFeedback'
import {type MessagesListItem} from '../components/MessageItem'
import buildMessagesListData from '../utils/buildMessagesListData'

export const ApprovalStatusMessage = {
  approved: 'approved',
  disapproved: 'disapproved',
} as const

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

  const offerForChatAtom = atom((get) => {
    const origin = get(chatAtom)?.origin
    return origin ? get(offerForChatOriginAtom(origin)) : null
  })

  const tradeChecklistAtom = focusAtom(chatWithMessagesAtom, (o) =>
    o.prop('tradeChecklist')
  )

  const hiddenMessagesIdsAtom = focusAtom(chatWithMessagesAtom, (o) =>
    o.prop('hiddenMessagesIds')
  )

  const createHideMessageAtom = (
    messageId: ChatMessageId | ChatTransientMessageId
  ): WritableAtom<boolean, [SetStateAction<boolean>], void> =>
    atom(
      (get) => HashSet.has(get(hiddenMessagesIdsAtom), messageId),
      (get, set, action: SetStateAction<boolean>) => {
        const value = getValueFromSetStateActionOfAtom(action)(() =>
          HashSet.has(get(hiddenMessagesIdsAtom), messageId)
        )
        set(hiddenMessagesIdsAtom, (prev) =>
          value ? HashSet.add(prev, messageId) : HashSet.remove(prev, messageId)
        )
      }
    )

  const messagesListDataAtom = atom((get) =>
    buildMessagesListData(
      get(messagesAtom),
      get(hiddenMessagesIdsAtom),
      get(tradeChecklistAtom)
    )
  )

  const otherSideDataAtom = selectOtherSideDataAtom(chatAtom)

  const otherSideGoldenAvatarTypeAtom = focusAtom(chatAtom, (o) =>
    o.prop('otherSide').prop('goldenAvatarType')
  )

  const otherSideClubsIdsAtom = focusAtom(chatAtom, (o) =>
    o.prop('otherSide').prop('clubsIds')
  )

  const lastMessageReadByOtherSideAtAtom = focusAtom(chatAtom, (o) =>
    o.prop('lastMessageReadByOtherSideAt')
  )

  function createFindMessageIndexInListAtom({
    direction,
    messageType,
  }: {
    direction: 'received' | 'sent'
    messageType: MessageType
  }): Atom<number> {
    return atom((get) => {
      const messagesList = get(messagesListDataAtom)

      return messagesList.findIndex(
        (message, index) =>
          message.type === 'message' &&
          message.message.state === direction &&
          (message.message.message.messageType === messageType ||
            message.message.message.tradeChecklistUpdate?.identity?.status ===
              messageType)
      )
    })
  }

  const revealIdentityRequestSentMessageIndexAtom =
    createFindMessageIndexInListAtom({
      messageType: 'REQUEST_REVEAL',
      direction: 'sent',
    })
  const isRevealIdentityRequestSentMessageHiddenAtom = atom(false)

  const revealIdentityRequestReceivedMessageIndexAtom =
    createFindMessageIndexInListAtom({
      messageType: 'REQUEST_REVEAL',
      direction: 'received',
    })

  const isRevealIdentityRequestReceivedMessageHiddenAtom = atom(false)

  const contactRevealRequestReceivedMessageIndexAtom =
    createFindMessageIndexInListAtom({
      messageType: 'REQUEST_CONTACT_REVEAL',
      direction: 'received',
    })
  const isContactRevealRequestReceivedMessageHiddenAtom = atom(false)

  const contactRevealRequestSentMessageIndexAtom =
    createFindMessageIndexInListAtom({
      messageType: 'REQUEST_CONTACT_REVEAL',
      direction: 'sent',
    })
  const isContactRevealRequestSentMessageHiddenAtom = atom(false)

  const handleIsRevealIdentityOrContactRevealMessageVisibleActionAtom = atom(
    null,
    (
      get,
      set,
      info: {
        viewableItems: Array<ViewToken<Atom<MessagesListItem>>>
        changed: Array<ViewToken<Atom<MessagesListItem>>>
      }
    ) => {
      const {viewableItems} = info
      const identityRevealStatus = get(identityRevealStatusAtom)
      const contactRevealStatus = get(contactRevealStatusAtom)

      const revealIdentityRequestSentMessageIndex = get(
        revealIdentityRequestSentMessageIndexAtom
      )
      const revealIdentityRequestReceivedMessageIndex = get(
        revealIdentityRequestReceivedMessageIndexAtom
      )
      const contactRevealRequestSentMessageIndex = get(
        contactRevealRequestSentMessageIndexAtom
      )
      const contactRevealRequestReceivedMessageIndex = get(
        contactRevealRequestReceivedMessageIndexAtom
      )

      if (identityRevealStatus === 'iAsked') {
        set(
          isRevealIdentityRequestSentMessageHiddenAtom,
          !viewableItems.some(
            (item) => item.index === revealIdentityRequestSentMessageIndex
          )
        )
      }

      if (identityRevealStatus === 'theyAsked') {
        set(
          isRevealIdentityRequestReceivedMessageHiddenAtom,
          !viewableItems.some(
            (item) => item.index === revealIdentityRequestReceivedMessageIndex
          )
        )
      }

      if (contactRevealStatus === 'iAsked') {
        set(
          isContactRevealRequestSentMessageHiddenAtom,
          !viewableItems.some(
            (item) => item.index === contactRevealRequestSentMessageIndex
          )
        )
      }

      if (contactRevealStatus === 'theyAsked') {
        set(
          isContactRevealRequestReceivedMessageHiddenAtom,
          !viewableItems.some(
            (item) => item.index === contactRevealRequestReceivedMessageIndex
          )
        )
      }
    }
  )

  const identityRevealRequestMessageIdAtom = atom((get) => {
    const messages = get(messagesAtom)

    return messages.find(
      (message) =>
        message.state === 'sent' &&
        (message.message.messageType === 'REQUEST_REVEAL' ||
          (message.message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
            message.message.tradeChecklistUpdate?.identity?.status ===
              'REQUEST_REVEAL'))
    )?.message.uuid
  })

  const contactRevealRequestMessageIdAtom = atom((get) => {
    const messages = get(messagesAtom)

    return messages.find(
      (message) =>
        message.state === 'sent' &&
        (message.message.messageType === 'REQUEST_CONTACT_REVEAL' ||
          (message.message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
            message.message.tradeChecklistUpdate?.contact?.status ===
              'REQUEST_REVEAL'))
    )?.message.uuid
  })

  const messagesListAtomAtoms = splitAtom(messagesListDataAtom)

  const deleteChatAtom = deleteChatActionAtom(chatWithMessagesAtom)

  const chatIdAtom = focusAtom(chatAtom, (o) => o.prop('id'))
  const publicKeyPemBase64Atom = focusAtom(chatAtom, (o) =>
    o.prop('inbox').prop('privateKey').prop('publicKeyPemBase64')
  )

  const requestMessageAtom = atom((get) =>
    pipe(
      get(messagesAtom),
      Array.findFirst(
        (message) =>
          message.state === 'received' &&
          message.message.messageType === 'REQUEST_MESSAGING'
      )
    )
  )

  const friendLevelForMyOfferAtom = atom(
    (get) =>
      pipe(
        get(requestMessageAtom),
        Option.map((message) => message.message.friendLevel),
        Option.getOrElse(() => [] as const)
      ) ?? []
  )

  const commonConnectionsHashesAtom = atom((get) => {
    const offer = get(offerForChatAtom)
    const commonFriendsForMyOffer = pipe(
      get(requestMessageAtom),
      Option.map((message) => message.message.commonFriends),
      Option.getOrElse(() => [] as const)
    )

    return offer?.ownershipInfo
      ? (commonFriendsForMyOffer ?? [])
      : (offer?.offerInfo.privatePart.commonFriends ?? [])
  })

  const verifiedConnectionsHashesAtom = atom((get) => {
    const offer = get(offerForChatAtom)
    const verifiedCommonFriendsForMyOffer = pipe(
      get(requestMessageAtom),
      Option.map((message) => message.message.verifiedCommonFriends),
      Option.getOrElse(() => [] as const)
    )

    return offer?.ownershipInfo
      ? verifiedCommonFriendsForMyOffer
      : (offer?.offerInfo.privatePart.verifiedCommonFriends ?? [])
  })

  const commonConnectionsCountAtom = selectAtom(
    commonConnectionsHashesAtom,
    (connections) => connections.length
  )

  const deleteChatWithUiFeedbackAtom = atom(
    null,
    (
      get,
      set,
      {
        skipAsk,
        skipDonation,
        skipFeedback,
      }: {skipAsk: boolean; skipDonation?: boolean; skipFeedback?: boolean}
    ) => {
      const {t} = get(translationAtom)

      return Effect.gen(function* (_) {
        const chatWithMessages = get(chatWithMessagesAtom)
        const deniedMessaging = get(focusWasDeniedAtom(chatWithMessagesAtom))
        const feedbackSubmitted = chatWithMessages.feedbackSubmitted

        if (!skipAsk) {
          const confirmedDelete = yield* _(
            set(globalDialogAtom, {
              title: t('messages.deleteChatQuestion'),
              subtitle: t('messages.deleteChatExplanation1'),
              negativeButtonText: t('common.back'),
              positiveButtonText: t('common.yesDelete'),
              positiveButtonVariant: 'destructive',
            })
          )

          if (!confirmedDelete) return false

          const confirmedDeleteAgain = yield* _(
            set(globalDialogAtom, {
              title: t('common.youSure'),
              subtitle: t('messages.deleteChatExplanation2'),
              negativeButtonText: t('common.nope'),
              positiveButtonText: t('messages.deleteChat'),
              positiveButtonVariant: 'destructive',
            })
          )

          if (!confirmedDeleteAgain) return false
        }

        set(loadingOverlayDisplayedAtom, true)

        yield* _(
          taskEitherToEffect(set(deleteChatAtom, {text: 'deleting chat'}))
        )

        set(loadingOverlayDisplayedAtom, false)

        if (deniedMessaging) return true

        if (skipDonation) {
          if (!skipFeedback && !feedbackSubmitted)
            void Effect.runFork(
              set(showUserFeedbackDialogAtom, {
                feedbackType: 'CHAT_RATING',
              })
            )
        } else {
          void Effect.runPromise(
            set(showDonationPromptGiveLoveActionAtom, {skipTimeCheck: true})
          ).then(() => {
            if (!skipFeedback && !feedbackSubmitted)
              void Effect.runFork(
                set(showUserFeedbackDialogAtom, {
                  feedbackType: 'CHAT_RATING',
                })
              )
          })
        }

        return true
      }).pipe(
        Effect.catchAll((e) => {
          set(loadingOverlayDisplayedAtom, false)

          showErrorAlert({
            title: t('common.somethingWentWrong'),
            description:
              toCommonErrorMessage(e, t) ??
              t('common.somethingWentWrongDescription'),
            error: e,
          })

          return Effect.succeed(false)
        })
      )
    }
  )

  const lastMessageAtom = selectAtom(messagesAtom, (o) => o.at(-1))
  const lastTradeChecklistMessageAtom = selectAtom(
    messagesAtom,
    Array.findLast(
      (message) => message.message.messageType === 'TRADE_CHECKLIST_UPDATE'
    )
  )

  const canSendMessagesAtom = createCanSendMessagesAtom(messagesAtom)
  const chatStateAtom = selectAtom(chatWithMessagesAtom, getChatState)
  const otherSideLeftAtom = focusOtherSideLeftAtom(chatWithMessagesAtom)
  const shouldGrayScaleAvatarAtom = atom((get) => {
    const chatState = get(chatStateAtom)
    const canSendMessages = get(canSendMessagesAtom)
    const otherSideLeft = get(otherSideLeftAtom)

    return (
      otherSideLeft ||
      (!canSendMessages &&
        chatState !== 'requestedByMe' &&
        chatState !== 'requestedByThem')
    )
  })

  const revealIdentityAtom = revealIdentityActionAtom(chatWithMessagesAtom)
  const revealContactAtom = revealContactActionAtom(chatWithMessagesAtom)

  const disapproveIdentityRevealWithUiFeedbackAtom = atom(
    null,
    async (get, set) => {
      const {t} = get(translationAtom)

      set(loadingOverlayDisplayedAtom, true)

      return await pipe(
        set(revealIdentityAtom, {
          type: 'DISAPPROVE_REVEAL',
          username: undefined,
        }),
        TE.match(
          (e) => {
            set(loadingOverlayDisplayedAtom, false)
            reportError('error', new Error('Error declining identityReveal'), {
              e,
            })
            showErrorAlert({
              title: t('common.somethingWentWrong'),
              description:
                toCommonErrorMessage(e, t) ??
                t('common.somethingWentWrongDescription'),
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
      const userDeclinedError = toBasicError('UserDeclinedError')(
        new Error('Declined')
      )

      return await pipe(
        set(globalDialogAtom, {
          title: modalContent.title,
          subtitle: modalContent.description,
          negativeButtonText: modalContent.negativeButtonText,
          positiveButtonText: modalContent.positiveButtonText,
        }),
        effectToTaskEither,
        TE.chainEitherK((confirmed) => {
          if (!confirmed) {
            if (type === 'RESPOND_REVEAL') {
              return E.right(
                'DISAPPROVE_CONTACT_REVEAL' as RevealContactMessageType
              )
            }

            return E.left(userDeclinedError)
          }

          return E.right(
            type === 'RESPOND_REVEAL'
              ? ('APPROVE_CONTACT_REVEAL' as RevealContactMessageType)
              : ('REQUEST_CONTACT_REVEAL' as RevealContactMessageType)
          )
        }),
        TE.map((revealType) => {
          set(loadingOverlayDisplayedAtom, true)
          return revealType
        }),
        TE.chainW((revealType) => set(revealContactAtom, {type: revealType})),
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
            reportError('error', new Error('Error sending contact reveal'), {
              e,
            })
            showErrorAlert({
              title: t('common.somethingWentWrong'),
              description:
                toCommonErrorMessage(e, t) ??
                t('common.somethingWentWrongDescription'),
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
    getIdentityRevealStatus
  )

  const contactRevealTriggeredFromTradeChecklistAtom = atom((get) => {
    const chatWithMessages = get(chatWithMessagesAtom)

    return (
      chatWithMessages.tradeChecklist.contact.received?.status ===
      'REQUEST_REVEAL'
    )
  })

  const contactRevealStatusAtom = selectAtom(
    chatWithMessagesAtom,
    getContactRevealStatus
  )

  const friendLevelInfoAtom = atom<readonly FriendLevel[]>((get) => {
    const originOffer = get(offerForChatAtom)

    if (originOffer?.ownershipInfo?.adminId) {
      return get(friendLevelForMyOfferAtom)
    }

    return originOffer?.offerInfo.privatePart?.friendLevel ?? []
  })

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
              void Effect.runPromise(
                andThenExpectBooleanNoErrors((success) => {
                  if (success) {
                    safeNavigateBackOutsideReact()
                  }
                })(set(deleteChatWithUiFeedbackAtom, {skipAsk: true}))
              )
            },
          },
        ]
      )
    }
  )

  const cancelRequestActionAtom = atom(null, (get, set) => {
    const offerInfo = get(offerForChatAtom)?.offerInfo
    if (!offerInfo) {
      return Effect.sync(() => {
        set(showOfferDeletedWithOptionToDeleteActionAtom)
      }).pipe(Effect.as(false))
    }

    return set(cancelRequestActionAtomHandleUI, {
      text: '',
      chatAtom: chatWithMessagesAtom,
    }).pipe(
      Effect.tapError((e) => Effect.log(e)),
      Effect.match({
        onFailure: () => false,
        onSuccess: () => true,
      })
    )
  })

  const selectedExtraToSendAtom = atom<ExtraToSend | undefined>(undefined)
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
    const tradeChecklistAmountData = getLatestAmountDataMessage(
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
      const agreedData = MeetingLocation.getLatestMeetingLocationDataMessage(
        get(tradeChecklistMeetingLocationAtom)
      )
      const dateAndTimeData = get(tradeChecklistDateAndTimeAtom)
      const pick = dateAndTime.getPick(dateAndTimeData)

      if (!pick) return T.of(false)

      const event = {
        startDate: DateTime.fromMillis(pick.pick.dateTime).toJSDate(),
        endDate: DateTime.fromMillis(pick.pick.dateTime).toJSDate(),
        title: t('tradeChecklist.vexlMeetingEventTitle', {
          name: t('common.otherSide'),
        }),
        location: agreedData?.locationData.data?.address,
        notes: agreedData?.locationData.data.note ?? '',
      }

      set(loadingOverlayDisplayedAtom, true)

      return pipe(
        TE.Do,
        TE.bindW('calendarId', () =>
          set(
            createCalendarIfNotExistsAndTryToResolvePermissionsAlongTheWayActionAtom
          )
        ),
        TE.bindW('createEventActionResult', ({calendarId}) =>
          createCalendarEvent({
            calendarEventId,
            calendarId,
            event,
          })
        ),
        TE.chainFirstW(({createEventActionResult: {action}}) => {
          const userDeclinedError = toBasicError('UserDeclinedError')(
            new Error('Declined')
          )

          return set(globalDialogAtom, {
            title:
              action === 'created'
                ? t('tradeChecklist.eventAddedSuccess')
                : t('tradeChecklist.eventEditSuccess'),
            subtitle:
              action === 'created'
                ? t('tradeChecklist.eventAddedSuccessDescription')
                : t('tradeChecklist.eventEditSuccessDescription'),
            positiveButtonText: t('common.close'),
          }).pipe(
            effectToTaskEither,
            TE.chainW((confirmed) =>
              confirmed ? TE.right(undefined) : TE.left(userDeclinedError)
            )
          )
        }),
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
                title: t('common.somethingWentWrong'),
                description:
                  toCommonErrorMessage(e, t) ??
                  t('common.somethingWentWrongDescription'),
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

  const btcPricePercentageDifferenceToDisplayInVexlbotMessageAtom = atom(
    (get) => {
      const amountData = get(tradeChecklistAmountAtom)
      const amountDataToDisplay = amount.getLatestAmountDataMessage(amountData)
      const btcPriceForTradeCurrency = get(btcPriceForTradeCurrencyAtom)

      return amount.calculateBtcPricePercentageDifference(
        amountDataToDisplay,
        btcPriceForTradeCurrency?.btcPrice?.BTC
      )
    }
  )

  const feedbackSubmittedAtom = focusAtom(chatWithMessagesAtom, (o) =>
    o.prop('feedbackSubmitted')
  )

  const approveChatRequestActionAtom = atom(
    null,
    (get, set, {approve, message}: {approve: boolean; message: string}) => {
      const {t} = get(translationAtom)

      return Effect.gen(function* (_) {
        set(loadingOverlayDisplayedAtom, true)

        const result = yield* _(
          taskEitherToEffect(
            set(acceptMessagingRequestAtom, {
              approve,
              chatAtom: chatWithMessagesAtom,
              text:
                message !== ''
                  ? message
                  : approve
                    ? ApprovalStatusMessage.approved
                    : ApprovalStatusMessage.disapproved,
            })
          ),
          Effect.either
        )

        set(loadingOverlayDisplayedAtom, false)

        if (Either.isLeft(result)) {
          if (
            result.left._tag === 'RequestCancelledError' ||
            result.left._tag === 'SenderInboxDoesNotExistError'
          ) {
            const shouldDeleteChat = yield* _(
              set(globalDialogAtom, {
                title: t('common.somethingWentWrong'),
                subtitle: t('offer.requestWasCancelledOrAccountDeleted'),
                positiveButtonText: t('common.yesDelete'),
                negativeButtonText: t('common.back'),
              })
            )

            if (!shouldDeleteChat) return false

            yield* _(
              set(deleteChatWithUiFeedbackAtom, {
                skipAsk: true,
                skipDonation: true,
                skipFeedback: true,
              })
            )

            if (navigationRef.isReady()) {
              navigationRef.reset({
                index: 0,
                routes: [
                  {
                    name: 'InsideTabs',
                    state: {
                      routes: [{name: 'Messages'}],
                    },
                  },
                ],
              })
            }

            return true
          }

          if (result.left._tag === 'RequestNotFoundError') {
            Alert.alert(t('offer.requestNotFound'))
          } else if (result.left._tag === 'ReceiverInboxDoesNotExistError') {
            Alert.alert(t('offer.otherSideAccountDeleted'))
          } else {
            showErrorAlert({
              title:
                toCommonErrorMessage(result.left, t) ??
                t('common.somethingWentWrong'),
              description: t('common.somethingWentWrongDescription'),
              error: result.left,
            })
          }

          return false
        }

        return true
      })
    }
  )

  return {
    chatAtom,
    chatWithMessagesAtom,
    commonConnectionsHashesAtom,
    verifiedConnectionsHashesAtom,
    commonConnectionsCountAtom,
    messagesAtom,
    offerForChatAtom,
    sendMessageAtom: sendMessageActionAtom(chatWithMessagesAtom),
    otherSideDataAtom,
    identityRevealStatusAtom,
    contactRevealStatusAtom,
    disapproveIdentityRevealWithUiFeedbackAtom,
    revealContactWithUiFeedbackAtom,
    deleteChatWithUiFeedbackAtom,
    messagesListAtomAtoms,
    lastMessageAtom,
    canSendMessagesAtom,
    friendLevelInfoAtom,
    replyToMessageAtom,
    theirOfferAndNotReportedAtom,
    requestStateAtom: createRequestStateAtom(chatWithMessagesAtom),
    chatStateAtom,
    shouldGrayScaleAvatarAtom,
    canBeRerequestedAtom: createCanChatBeRerequestedAtom(chatWithMessagesAtom),
    showOfferDeletedWithOptionToDeleteActionAtom,
    otherSideSupportsTradingChecklistAtom:
      createOtherSideSupportsTradingChecklistAtom(chatAtom),
    cancelRequestActionAtom,
    showInfoBarAtom,
    showVexlbotNotificationsForCurrentChatAtom,
    showVexlbotInitialMessageForCurrentChatAtom,
    publicKeyPemBase64Atom,
    chatIdAtom,
    tradeChecklistDateAndTimeAtom,
    tradeChecklistNetworkAtom,
    tradeChecklistAmountAtom,
    tradeChecklistContactRevealAtom,
    contactRevealTriggeredFromTradeChecklistAtom,
    tradeChecklistMeetingLocationAtom,
    shouldHideNetworkCellForTradeChecklistAtom,
    tradeOrOriginOfferCurrencyAtom,
    calendarEventIdAtom,
    isDateAndTimePickedAtom,
    addEventToCalendarActionAtom,
    listingTypeIsOtherAtom,
    handleIsRevealIdentityOrContactRevealMessageVisibleActionAtom,
    identityRevealRequestMessageIdAtom,
    contactRevealRequestMessageIdAtom,
    feedbackSubmittedAtom,
    btcPricePercentageDifferenceToDisplayInVexlbotMessageAtom,
    otherSideGoldenAvatarTypeAtom,
    otherSideClubsIdsAtom,
    approveChatRequestActionAtom,
    lastTradeChecklistMessageAtom,
    lastMessageReadByOtherSideAtAtom,
    createHideMessageAtom,
  }
})
