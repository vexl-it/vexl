import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useAtomValue, useSetAtom} from 'jotai'
import {Text, XStack, YStack} from 'tamagui'
import Button from '../../Button'
import UserAvatar from '../../UserAvatar'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {useTranslation} from '../../../utils/localization/I18nProvider'

function QuickActionBannerUi({
  leftElement,
  headingType,
  onButtonPress,
  topText,
  bottomText,
  buttonText,
}: {
  leftElement: React.ReactNode
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
      {leftElement}
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
        small
        variant="secondary"
        text={buttonText}
      />
    </XStack>
  )
}

function QuickActionBanner(): JSX.Element | null {
  const safeGoBack = useSafeGoBack()
  const {t} = useTranslation()

  const {lastMessageAtom, otherSideDataAtom, deleteChatWithUiFeedbackAtom} =
    useMolecule(chatMolecule)

  const lastMessage = useAtomValue(lastMessageAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const deleteChat = useSetAtom(deleteChatWithUiFeedbackAtom)

  if (!lastMessage || lastMessage.state === 'sent') return null

  if (lastMessage.message.messageType === 'DELETE_CHAT') {
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
          void deleteChat().then((result) => {
            if (result) safeGoBack()
          })
        }}
      />
    )
  }
  if (lastMessage.message.messageType === 'BLOCK_CHAT') {
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
            if (result) safeGoBack()
          })
        }}
      />
    )
  }

  if (lastMessage.message.messageType === 'INBOX_DELETED') {
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
            if (result) safeGoBack()
          })
        }}
      />
    )
  }

  if (lastMessage.message.messageType === 'OFFER_DELETED') {
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
            if (result) safeGoBack()
          })
        }}
      />
    )
  }

  return null
}

export default QuickActionBanner
