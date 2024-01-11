import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useAtomValue, useSetAtom} from 'jotai'
import {getTokens, Text, XStack, YStack} from 'tamagui'
import Button from '../../Button'
import UserAvatar from '../../UserAvatar'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useResetNavigationToMessagingScreen from '../../../utils/useResetNavigationToMessagingScreen'
import {Keyboard} from 'react-native'
import {useHideActionForMessage} from '../atoms/createHideActionForMessageMmkvAtom'
import {useCallback} from 'react'
import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import IconButton from '../../IconButton'
import phoneSvg from '../images/phoneSvg'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {addContactWithUiFeedbackAtom} from '../../../state/contacts/atom/addContactWithUiFeedbackAtom'

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
}): JSX.Element {
  const tokens = getTokens()
  const headingStyle = {ff: '$body600', fos: 16, color: '$black'} as const
  const subtitleStyle = {ff: '$body500', color: '$greyOnWhite'} as const

  return (
    <XStack
      space={'$2'}
      bc="$white"
      py="$3"
      px="$4"
      ai={'center'}
      jc={'space-between'}
    >
      {leftElement && leftElement}
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
          variant={'secondary'}
          icon={icon}
          iconFill={tokens.color.black.val}
          onPress={onButtonPress}
        />
      ) : (
        <Button
          onPress={onButtonPress}
          size={'small'}
          variant="secondary"
          text={buttonText}
        />
      )}
    </XStack>
  )
}

function QuickActionBanner(): JSX.Element | null {
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
  const deleteChat = useSetAtom(deleteChatWithUiFeedbackAtom)
  const revealIdentity = useSetAtom(revealIdentityWithUiFeedbackAtom)
  const revealContact = useSetAtom(revealContactWithUiFeedbackAtom)
  const requestState = useAtomValue(requestStateAtom)
  const setShowHistory = useSetAtom(forceShowHistoryAtom)
  const addRevealedContact = useSetAtom(addContactWithUiFeedbackAtom)

  const onBackToRequestPressed = useCallback(() => {
    setShowHistory(false)
  }, [setShowHistory])

  const [isHidden, hide] = useHideActionForMessage(lastMessage?.message.uuid)

  if (!lastMessage || isHidden) return null

  if (requestState === 'requested') {
    return (
      <QuickActionBannerUi
        leftElement={<></>}
        headingType={'boldTop'}
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
        headingType={'boldBottom'}
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
          void deleteChat().then((result) => {
            if (result) {
              resetNavigationToMessagingScreen()
            }
          })
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
        headingType={'boldBottom'}
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
          void deleteChat().then((result) => {
            if (result) resetNavigationToMessagingScreen()
          })
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
        headingType={'boldBottom'}
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
          void deleteChat().then((result) => {
            if (result) resetNavigationToMessagingScreen()
          })
        }}
      />
    )
  }

  if (
    identityRevealStatus === 'theyAsked' &&
    !identityRevealTriggeredFromTradeChecklist
  ) {
    return (
      <QuickActionBannerUi
        topText={t('messages.identityRevealRequest')}
        bottomText={t('messages.tapToReveal')}
        headingType={'boldTop'}
        buttonText={t('common.more')}
        leftElement={
          <UserAvatar width={48} height={48} userImage={otherSideData.image} />
        }
        onButtonPress={() => {
          void revealIdentity('RESPOND_REVEAL')
        }}
      />
    )
  }

  if (identityRevealStatus === 'iAsked') {
    return (
      <QuickActionBannerUi
        topText={t('messages.identitySend.title')}
        bottomText={t('messages.identitySend.subtitle')}
        headingType={'boldTop'}
        buttonText={t('common.ok')}
        leftElement={
          <UserAvatar width={48} height={48} userImage={otherSideData.image} />
        }
        onButtonPress={() => {
          hide()
        }}
      />
    )
  }

  if (contactRevealStatus === 'iAsked') {
    return (
      <QuickActionBannerUi
        topText={t('messages.contactRevealSent.title')}
        bottomText={t('messages.contactRevealSent.subtitle')}
        headingType={'boldTop'}
        buttonText={t('common.ok')}
        leftElement={
          <UserAvatar width={48} height={48} userImage={otherSideData.image} />
        }
        onButtonPress={() => {
          hide()
        }}
      />
    )
  }

  if (
    contactRevealStatus === 'theyAsked' &&
    !contactRevealTriggeredFromTradeChecklist
  ) {
    return (
      <QuickActionBannerUi
        topText={t('messages.contactRevealRequest')}
        bottomText={t('messages.tapToReveal')}
        headingType={'boldTop'}
        buttonText={t('common.more')}
        leftElement={
          <UserAvatar width={48} height={48} userImage={otherSideData.image} />
        }
        onButtonPress={() => {
          void revealContact('RESPOND_REVEAL')
        }}
      />
    )
  }

  if (contactRevealStatus === 'shared') {
    return (
      <QuickActionBannerUi
        topText={t('messages.addUserToYourContacts', {
          name: otherSideData.userName,
        })}
        bottomText={t('messages.tapToAddToYourVexlContacts')}
        headingType={'boldTop'}
        icon={phoneSvg}
        leftElement={
          <UserAvatar width={48} height={48} userImage={otherSideData.image} />
        }
        onButtonPress={() => {
          const fullPhoneNumber =
            otherSideData.fullPhoneNumber ??
            lastMessage.message.deanonymizedUser?.fullPhoneNumber

          if (fullPhoneNumber) {
            void addRevealedContact({
              name: fullPhoneNumber,
              normalizedNumber: E164PhoneNumber.parse(fullPhoneNumber),
              fromContactList: false,
              numberToDisplay: fullPhoneNumber,
            })
            hide()
          }
        }}
      />
    )
  }

  return null
}

export default QuickActionBanner
