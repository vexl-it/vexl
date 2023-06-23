import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useAtomValue, useSetAtom} from 'jotai'
import {Text, XStack, YStack} from 'tamagui'
import Button from '../../Button'
import UserAvatar from '../../UserAvatar'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useResetNavigationToMessagingScreen from '../../../utils/useResetNavigationToMessagingScreen'
import {Keyboard} from 'react-native'
import {useHideActionForMessage} from '../atoms/createHideActionForMessageMmkvAtom'
import {useCallback} from 'react'

function QuickActionBannerUi({
  leftElement,
  headingType,
  onButtonPress,
  topText,
  bottomText,
  buttonText,
}: {
  leftElement?: React.ReactNode
  headingType: 'boldTop' | 'boldBottom'
  onButtonPress: () => void
  topText: string
  bottomText: string
  buttonText: string
}): JSX.Element {
  const headingStyle = {ff: '$body600', fos: 16}
  const subtitleStyle = {ff: '$body500', color: '$greyOnWhite'}

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
      <Button
        onPress={onButtonPress}
        size={'small'}
        variant="secondary"
        text={buttonText}
      />
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
    revealIdentityWithUiFeedbackAtom,
    requestStateAtom,
    forceShowHistoryAtom,
  } = useMolecule(chatMolecule)

  const lastMessage = useAtomValue(lastMessageAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const identityRevealStatus = useAtomValue(identityRevealStatusAtom)
  const deleteChat = useSetAtom(deleteChatWithUiFeedbackAtom)
  const revealIdentity = useSetAtom(revealIdentityWithUiFeedbackAtom)
  const requestState = useAtomValue(requestStateAtom)
  const setShowHistory = useSetAtom(forceShowHistoryAtom)

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
            if (result) resetNavigationToMessagingScreen()
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
    lastMessage.message.messageType === 'OFFER_DELETED' &&
    lastMessage.state === 'received'
  ) {
    return (
      <QuickActionBannerUi
        topText={t('messages.messagePreviews.incoming.OFFER_DELETED', {
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
  if (identityRevealStatus === 'theyAsked') {
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

  return null
}

export default QuickActionBanner
