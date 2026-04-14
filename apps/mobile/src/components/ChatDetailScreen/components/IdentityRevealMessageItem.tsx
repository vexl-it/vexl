import {useNavigation} from '@react-navigation/native'
import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {
  ArrowsHorizontal,
  Avatar,
  Button,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {SvgXml} from 'react-native-svg'
import {useTheme} from 'tamagui'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import anonymizePhoneNumber from '../../../state/chat/utils/anonymizePhoneNumber'
import {
  userDataRealOrAnonymizedAtom,
  userPhoneNumberAtom,
} from '../../../state/session/userDataAtoms'
import {getInternationalPhoneNumber} from '../../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {shouldOpenRevealIdentitySummaryAtom} from '../../TradeChecklistFlow/atoms/revealIdentityAtoms'
import {chatMolecule} from '../atoms'
import {useHideActionForMessage} from '../atoms/createHideActionForMessageMmkvAtom'
import VexlbotActionCard from './VexlbotMessageItem/components/VexlbotActionCard'

const requestDeclinedAvatar = require('./images/requestDeclined.png')
const identityAvatarSize = 80

function IdentityRevealAvatar({
  image,
  onPress,
}: {
  image: RealLifeInfo['image']
  onPress?: () => void
}): React.JSX.Element {
  const avatar =
    image.type === 'imageUri' ? (
      <Avatar
        customSize={identityAvatarSize}
        source={{uri: resolveLocalUri(image.imageUri)}}
      />
    ) : (
      <Avatar customSize={identityAvatarSize}>
        <SvgXml
          width={identityAvatarSize}
          height={identityAvatarSize}
          xml={image.svgXml.xml}
        />
      </Avatar>
    )

  return onPress ? (
    <TouchableOpacity onPress={onPress}>{avatar}</TouchableOpacity>
  ) : (
    avatar
  )
}

function IdentityRevealSide({
  image,
  name,
  phoneNumber,
  onAvatarPress,
}: {
  image: RealLifeInfo['image']
  name: string
  phoneNumber?: string
  onAvatarPress?: () => void
}): React.JSX.Element {
  return (
    <YStack alignItems="center" flex={1} gap="$2">
      <IdentityRevealAvatar image={image} onPress={onAvatarPress} />
      <YStack alignItems="center" gap="$1">
        <Typography
          color="$foregroundPrimary"
          textAlign="center"
          variant="titlesSmall"
        >
          {name}
        </Typography>
        {phoneNumber ? (
          <Typography
            color="$foregroundSecondary"
            textAlign="center"
            variant="paragraph"
          >
            {phoneNumber}
          </Typography>
        ) : null}
      </YStack>
    </YStack>
  )
}

function IdentityRevealMessageItem({
  message,
  isLatest,
}: {
  message: ChatMessageWithState
  isLatest: boolean
}): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const {
    chatAtom,
    identityRevealStatusAtom,
    contactRevealStatusAtom,
    otherSideDataAtom,
    disapproveIdentityRevealWithUiFeedbackAtom,
    identityRevealRequestMessageIdAtom,
    openedImageUriAtom,
  } = useMolecule(chatMolecule)
  const {image, userName, partialPhoneNumber, fullPhoneNumber} =
    useAtomValue(otherSideDataAtom)
  const chat = useAtomValue(chatAtom)
  const identityRevealStatus = useAtomValue(identityRevealStatusAtom)
  const contactRevealStatus = useAtomValue(contactRevealStatusAtom)
  const identityRevealRequestMessageId = useAtomValue(
    identityRevealRequestMessageIdAtom
  )
  const myRealLifeInfo = useAtomValue(userDataRealOrAnonymizedAtom)
  const myPhoneNumber = useAtomValue(userPhoneNumberAtom)
  const disapproveIdentityReveal = useSetAtom(
    disapproveIdentityRevealWithUiFeedbackAtom
  )
  const setOpenedImageUri = useSetAtom(openedImageUriAtom)
  const shouldOpenRevealIdentitySummary = useAtomValue(
    shouldOpenRevealIdentitySummaryAtom
  )
  const theme = useTheme()
  const [identityRevealRequestHidden, hideIdentityRevealRequest] =
    useHideActionForMessage(identityRevealRequestMessageId)

  const myPhoneNumberText =
    contactRevealStatus === 'shared'
      ? getInternationalPhoneNumber(myPhoneNumber)
      : anonymizePhoneNumber(myPhoneNumber)

  const otherSidePhoneNumberText = fullPhoneNumber
    ? getInternationalPhoneNumber(fullPhoneNumber)
    : partialPhoneNumber

  const isIdentityRevealRequest =
    message.message.messageType === 'REQUEST_REVEAL' ||
    ((message.state === 'sent' || message.state === 'received') &&
      message.message.tradeChecklistUpdate?.identity?.status ===
        'REQUEST_REVEAL')

  if (isIdentityRevealRequest && identityRevealStatus === 'theyAsked') {
    return (
      <VexlbotActionCard
        description="Other side want's to reveal identities"
        statusLabel={t('vexlbot.reactionRequired')}
        title="Do you want to reveal your identity?"
      >
        <XStack gap="$3" width="100%">
          <Button
            flex={1}
            onPress={() => {
              void disapproveIdentityReveal()
            }}
            size="medium"
            variant="secondary"
          >
            {t('common.noThanks')}
          </Button>
          <Button
            flex={1}
            onPress={() => {
              navigation.navigate('TradeChecklistFlow', {
                screen: shouldOpenRevealIdentitySummary
                  ? 'RevealIdentitySummary'
                  : 'RevealIdentityPhoto',
                chatId: chat.id,
                inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
              })
            }}
            size="medium"
            variant="primary"
          >
            {t('common.letsdothis')}
          </Button>
        </XStack>
      </VexlbotActionCard>
    )
  }

  if (
    isIdentityRevealRequest &&
    identityRevealStatus === 'iAsked' &&
    !identityRevealRequestHidden
  ) {
    return (
      <VexlbotActionCard
        description="Share your identity with the other person"
        onClosePress={hideIdentityRevealRequest}
        title="Do you want to reveal your identity?"
      >
        <XStack gap="$3" width="100%">
          <Button
            flex={1}
            onPress={() => {
              void disapproveIdentityReveal()
            }}
            size="medium"
            variant="secondary"
          >
            {t('common.noThanks')}
          </Button>
          <Button
            flex={1}
            onPress={() => {
              navigation.navigate('TradeChecklistFlow', {
                screen: shouldOpenRevealIdentitySummary
                  ? 'RevealIdentitySummary'
                  : 'RevealIdentityPhoto',
                chatId: chat.id,
                inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
              })
            }}
            size="medium"
            variant="primary"
          >
            {t('common.letsdothis')}
          </Button>
        </XStack>
      </VexlbotActionCard>
    )
  }

  if (
    identityRevealStatus === 'shared' &&
    (message.state === 'received' || message.state === 'sent') &&
    (message.message.messageType === 'APPROVE_REVEAL' ||
      message.message.tradeChecklistUpdate?.identity?.status ===
        'APPROVE_REVEAL')
  ) {
    return (
      <YStack mb={isLatest ? '$10' : '$4'} mt="$4" mx="$4">
        <YStack
          alignItems="center"
          backgroundColor="$backgroundSecondary"
          borderRadius="$6"
          gap="$5"
          padding="$5"
          width="100%"
        >
          <Typography
            color="$foregroundPrimary"
            textAlign="center"
            variant="titlesSmall"
          >
            Your identity is revealed
          </Typography>
          <XStack alignItems="center" gap="$4" width="100%">
            <IdentityRevealSide
              image={myRealLifeInfo.image}
              name={myRealLifeInfo.userName}
              phoneNumber={myPhoneNumberText}
            />
            <ArrowsHorizontal color={theme.foregroundPrimary.val} size={28} />
            <IdentityRevealSide
              image={image}
              name={userName}
              onAvatarPress={
                image.type === 'imageUri'
                  ? () => {
                      setOpenedImageUri(resolveLocalUri(image.imageUri))
                    }
                  : undefined
              }
              phoneNumber={otherSidePhoneNumberText}
            />
          </XStack>
        </YStack>
      </YStack>
    )
  }

  if (
    identityRevealStatus === 'denied' &&
    (message.message.messageType === 'DISAPPROVE_REVEAL' ||
      ((message.state === 'sent' || message.state === 'received') &&
        message.message.tradeChecklistUpdate?.identity?.status ===
          'DISAPPROVE_REVEAL'))
  ) {
    return (
      <YStack mb="$4" mt="$4" mx="$4" maxWidth="84%">
        <YStack
          alignItems="center"
          backgroundColor="$backgroundSecondary"
          borderRadius="$6"
          gap="$1"
          paddingHorizontal="$5"
          paddingVertical="$4"
          width="100%"
        >
          <Avatar customSize={56} source={requestDeclinedAvatar} />
          <Typography color="$foregroundPrimary" variant="paragraphDemibold">
            {message.state === 'received' ? 'Unknown' : t('common.you')}
          </Typography>
          <Typography
            color="$foregroundSecondary"
            textAlign="center"
            variant="paragraphSmall"
          >
            {message.state === 'received'
              ? 'The other person declined'
              : t('messages.youDeclined')}
          </Typography>
        </YStack>
      </YStack>
    )
  }

  return null
}

export default IdentityRevealMessageItem
