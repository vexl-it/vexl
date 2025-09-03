import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {useMolecule} from 'bunshi/dist/react'
import {Effect, Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Keyboard} from 'react-native'
import {Text, XStack, YStack, getTokens} from 'tamagui'
import {addContactWithUiFeedbackActionAtom} from '../../../state/contacts/atom/addContactWithUiFeedbackAtom'
import {hashPhoneNumber} from '../../../state/contacts/utils'
import {andThenExpectBooleanNoErrors} from '../../../utils/andThenExpectNoErrors'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import useResetNavigationToMessagingScreen from '../../../utils/useResetNavigationToMessagingScreen'
import Button from '../../Button'
import IconButton from '../../IconButton'
import {revealContactFromQuickActionBannerAtom} from '../../TradeChecklistFlow/atoms/revealContactAtoms'
import {revealIdentityFromQuickActionBannerAtom} from '../../TradeChecklistFlow/atoms/revealIdentityAtoms'
import UserAvatar from '../../UserAvatar'
import {chatMolecule} from '../atoms'
import {useHideActionForMessage} from '../atoms/createHideActionForMessageMmkvAtom'
import phoneSvg from '../images/phoneSvg'

export const QUICK_ACTION_BANNER_HEIGHT_WITH_PADDING = 70

function QuickActionBannerUi({
  leftElement,
  headingType,
  onButtonPress,
  topText,
  bottomText,
  buttonText,
  icon,
}: {
  leftElement?: React.ReactNode
  headingType: 'boldTop' | 'boldBottom'
  onButtonPress: () => void
  topText: string
  bottomText: string
  buttonText?: string
  icon?: SvgString
}): React.ReactElement {
  const tokens = getTokens()
  const headingStyle = {ff: '$body600', fos: 16, color: '$black'} as const
  const subtitleStyle = {ff: '$body500', color: '$greyOnWhite'} as const

  return (
    <XStack
      h={QUICK_ACTION_BANNER_HEIGHT_WITH_PADDING}
      gap="$2"
      bc="$white"
      px="$4"
      ai="center"
      jc="space-between"
    >
      {!!leftElement && leftElement}
      <YStack flex={1}>
        <Text {...(headingType === 'boldTop' ? headingStyle : subtitleStyle)}>
          {topText}
        </Text>
        <Text
          {...(headingType === 'boldBottom' ? headingStyle : subtitleStyle)}
        >
          {bottomText}
        </Text>
      </YStack>
      {icon ? (
        <IconButton
          height={40}
          width={40}
          variant="secondary"
          icon={icon}
          iconFill={tokens.color.black.val}
          onPress={onButtonPress}
        />
      ) : (
        <Button
          onPress={onButtonPress}
          size="small"
          variant="secondary"
          text={buttonText}
        />
      )}
    </XStack>
  )
}

function QuickActionBanner(): React.ReactElement | null {
  const {t} = useTranslation()
  const resetNavigationToMessagingScreen = useResetNavigationToMessagingScreen()

  const {
    lastMessageAtom,
    otherSideDataAtom,
    deleteChatWithUiFeedbackAtom,
    identityRevealStatusAtom,
    contactRevealStatusAtom,
    revealIdentityWithUiFeedbackAtom,
    revealContactWithUiFeedbackAtom,
    requestStateAtom,
    forceShowHistoryAtom,
    identityRevealTriggeredFromTradeChecklistAtom,
    contactRevealTriggeredFromTradeChecklistAtom,
    publicKeyPemBase64Atom,
    chatIdAtom,
    isRevealIdentityRequestReceivedMessageHiddenAtom,
    isRevealIdentityRequestSentMessageHiddenAtom,
    isContactRevealRequestReceivedMessageHiddenAtom,
    isContactRevealRequestSentMessageHiddenAtom,
    isContactAlreadyInContactsListAtom,
    identityRevealRequestMessageIdAtom,
    contactRevealRequestMessageIdAtom,
    contactRevealApproveMessageIdAtom,
  } = useMolecule(chatMolecule)

  const lastMessage = useAtomValue(lastMessageAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const identityRevealStatus = useAtomValue(identityRevealStatusAtom)
  const contactRevealStatus = useAtomValue(contactRevealStatusAtom)
  const identityRevealTriggeredFromTradeChecklist = useAtomValue(
    identityRevealTriggeredFromTradeChecklistAtom
  )
  const contactRevealTriggeredFromTradeChecklist = useAtomValue(
    contactRevealTriggeredFromTradeChecklistAtom
  )
  const deleteChatWithUiFeedback = useSetAtom(deleteChatWithUiFeedbackAtom)
  const revealIdentity = useSetAtom(revealIdentityWithUiFeedbackAtom)
  const revealContact = useSetAtom(revealContactWithUiFeedbackAtom)
  const requestState = useAtomValue(requestStateAtom)
  const setShowHistory = useSetAtom(forceShowHistoryAtom)
  const addRevealedContact = useSetAtom(addContactWithUiFeedbackActionAtom)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const revealIdentityFromQuickActionBanner = useSetAtom(
    revealIdentityFromQuickActionBannerAtom
  )
  const revealContactFromQuickActionBanner = useSetAtom(
    revealContactFromQuickActionBannerAtom
  )
  const isRevealIdentityRequestSentMessageHidden = useAtomValue(
    isRevealIdentityRequestSentMessageHiddenAtom
  )
  const isRevealIdentityRequestReceivedMessageHidden = useAtomValue(
    isRevealIdentityRequestReceivedMessageHiddenAtom
  )
  const isContactRevealRequestSentMessageHidden = useAtomValue(
    isContactRevealRequestSentMessageHiddenAtom
  )
  const isContactRevealRequestReceivedMessageHidden = useAtomValue(
    isContactRevealRequestReceivedMessageHiddenAtom
  )
  const isContactAlreadyInContactsList = useAtomValue(
    isContactAlreadyInContactsListAtom
  )
  const identityRevealRequestMessageId = useAtomValue(
    identityRevealRequestMessageIdAtom
  )
  const contactRevealRequestMessageId = useAtomValue(
    contactRevealRequestMessageIdAtom
  )
  const contactRevealApproveMessageId = useAtomValue(
    contactRevealApproveMessageIdAtom
  )

  const onBackToRequestPressed = useCallback(() => {
    setShowHistory(false)
  }, [setShowHistory])

  const [
    identityRevealRequestedBannerHidden,
    setIdentityRevealRequestedBannerHidden,
  ] = useHideActionForMessage(identityRevealRequestMessageId)
  const [
    contactRevealRequestedBannerHidden,
    setContactRevealRequestedBannerHidden,
  ] = useHideActionForMessage(contactRevealRequestMessageId)
  const [
    contactRevealApprovedBannerHidden,
    setContactRevealApprovedBannerHidden,
  ] = useHideActionForMessage(contactRevealApproveMessageId)

  if (!lastMessage) return null

  if (requestState === 'requested') {
    return (
      <QuickActionBannerUi
        leftElement={<></>}
        headingType="boldTop"
        onButtonPress={onBackToRequestPressed}
        topText={t('messages.actionBanner.requestPending')}
        bottomText={t('messages.actionBanner.bottomText')}
        buttonText={t('messages.actionBanner.buttonText')}
      />
    )
  }

  if (
    lastMessage.message.messageType === 'DELETE_CHAT' &&
    lastMessage.state === 'received'
  ) {
    return (
      <QuickActionBannerUi
        topText={t('messages.messagePreviews.incoming.DELETE_CHAT', {
          them: otherSideData.userName,
        })}
        bottomText={t('messages.leaveToo')}
        headingType="boldBottom"
        buttonText={t('messages.deleteChat')}
        leftElement={
          <UserAvatar
            width={48}
            height={48}
            grayScale
            userImage={otherSideData.image}
          />
        }
        onButtonPress={() => {
          Keyboard.dismiss()
          void Effect.runPromise(
            andThenExpectBooleanNoErrors((result) => {
              if (result) {
                resetNavigationToMessagingScreen()
              }
            })(deleteChatWithUiFeedback({skipAsk: false}))
          )
        }}
      />
    )
  }

  if (
    lastMessage.message.messageType === 'BLOCK_CHAT' &&
    lastMessage.state === 'received'
  ) {
    return (
      <QuickActionBannerUi
        topText={t('messages.messagePreviews.incoming.BLOCK_CHAT', {
          them: otherSideData.userName,
        })}
        bottomText={t('messages.leaveChat')}
        headingType="boldBottom"
        buttonText={t('messages.deleteChat')}
        leftElement={
          <UserAvatar
            width={48}
            height={48}
            grayScale
            userImage={otherSideData.image}
          />
        }
        onButtonPress={() => {
          void Effect.runPromise(
            andThenExpectBooleanNoErrors((result) => {
              if (result) {
                resetNavigationToMessagingScreen()
              }
            })(deleteChatWithUiFeedback({skipAsk: false}))
          )
        }}
      />
    )
  }

  if (
    lastMessage.message.messageType === 'INBOX_DELETED' &&
    lastMessage.state === 'received'
  ) {
    return (
      <QuickActionBannerUi
        topText={t('messages.messagePreviews.incoming.INBOX_DELETED', {
          them: otherSideData.userName,
        })}
        bottomText={t('messages.leaveChat')}
        headingType="boldBottom"
        buttonText={t('messages.deleteChat')}
        leftElement={
          <UserAvatar
            width={48}
            height={48}
            grayScale
            userImage={otherSideData.image}
          />
        }
        onButtonPress={() => {
          void Effect.runPromise(
            andThenExpectBooleanNoErrors((result) => {
              if (result) {
                resetNavigationToMessagingScreen()
              }
            })(deleteChatWithUiFeedback({skipAsk: false}))
          )
        }}
      />
    )
  }

  if (
    identityRevealStatus === 'theyAsked' &&
    isRevealIdentityRequestReceivedMessageHidden
  ) {
    return (
      <QuickActionBannerUi
        topText={t('messages.identityRevealRequest')}
        bottomText={t('messages.tapToReveal')}
        headingType="boldTop"
        buttonText={t('common.more')}
        leftElement={
          <UserAvatar width={48} height={48} userImage={otherSideData.image} />
        }
        onButtonPress={() => {
          if (identityRevealTriggeredFromTradeChecklist) {
            void revealIdentityFromQuickActionBanner({chatId, inboxKey})
          } else {
            void revealIdentity('RESPOND_REVEAL')
          }
        }}
      />
    )
  }

  if (
    !identityRevealRequestedBannerHidden &&
    identityRevealStatus === 'iAsked' &&
    isRevealIdentityRequestSentMessageHidden
  ) {
    return (
      <QuickActionBannerUi
        topText={t('messages.identitySend.title')}
        bottomText={t('messages.identitySend.subtitle')}
        headingType="boldTop"
        buttonText={t('common.ok')}
        leftElement={
          <UserAvatar width={48} height={48} userImage={otherSideData.image} />
        }
        onButtonPress={() => {
          setIdentityRevealRequestedBannerHidden()
        }}
      />
    )
  }

  if (
    !contactRevealRequestedBannerHidden &&
    contactRevealStatus === 'iAsked' &&
    isContactRevealRequestSentMessageHidden
  ) {
    return (
      <QuickActionBannerUi
        topText={t('messages.contactRevealSent.title')}
        bottomText={t('messages.contactRevealSent.subtitle')}
        headingType="boldTop"
        buttonText={t('common.ok')}
        leftElement={
          <UserAvatar width={48} height={48} userImage={otherSideData.image} />
        }
        onButtonPress={() => {
          setContactRevealRequestedBannerHidden()
        }}
      />
    )
  }

  if (
    contactRevealStatus === 'theyAsked' &&
    isContactRevealRequestReceivedMessageHidden
  ) {
    return (
      <QuickActionBannerUi
        topText={t('messages.contactRevealRequest')}
        bottomText={t('messages.tapToReveal')}
        headingType="boldTop"
        buttonText={t('common.more')}
        leftElement={
          <UserAvatar width={48} height={48} userImage={otherSideData.image} />
        }
        onButtonPress={() => {
          if (contactRevealTriggeredFromTradeChecklist) {
            void revealContactFromQuickActionBanner({chatId, inboxKey})
          } else {
            void revealContact('RESPOND_REVEAL')
          }
        }}
      />
    )
  }

  if (
    !contactRevealApprovedBannerHidden &&
    contactRevealStatus === 'shared' &&
    !isContactAlreadyInContactsList
  ) {
    return (
      <QuickActionBannerUi
        topText={t('messages.addUserToYourContacts', {
          name: otherSideData.userName,
        })}
        bottomText={t('messages.tapToAddToYourVexlContacts')}
        headingType="boldTop"
        icon={phoneSvg}
        leftElement={
          <UserAvatar width={48} height={48} userImage={otherSideData.image} />
        }
        onButtonPress={() => {
          try {
            const fullPhoneNumber = otherSideData.fullPhoneNumber

            if (fullPhoneNumber) {
              const numberHash = hashPhoneNumber(fullPhoneNumber)
              if (numberHash._tag === 'Left') {
                reportError(
                  'warn',
                  new Error('hashPhoneNumber failed in QuickActionBanner.tsx'),
                  {error: numberHash.left}
                )
                return
              }

              Effect.runFork(
                addRevealedContact({
                  info: {
                    name: otherSideData.userName,
                    numberToDisplay: fullPhoneNumber,
                    rawNumber: fullPhoneNumber,
                    label: Option.none(),
                    nonUniqueContactId: Option.none(),
                  },
                  computedValues: {
                    normalizedNumber: fullPhoneNumber,
                    hash: numberHash.right,
                  },
                })
              )
            }
          } finally {
            setContactRevealApprovedBannerHidden()
          }
        }}
      />
    )
  }

  return null
}

export default QuickActionBanner
