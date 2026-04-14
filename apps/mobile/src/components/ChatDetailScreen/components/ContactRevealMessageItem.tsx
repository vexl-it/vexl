import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {effectToEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {
  AddUserPersonContact,
  ArrowsHorizontal,
  Avatar,
  Button,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Option, Schema} from 'effect'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {SvgXml} from 'react-native-svg'
import {useTheme} from 'tamagui'
import blockPhoneNumberRevealSvg from '../../../images/blockPhoneNumberRevealSvg'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {addContactWithUiFeedbackActionAtom} from '../../../state/contacts/atom/addContactWithUiFeedbackAtom'
import {hashPhoneNumber} from '../../../state/contacts/utils'
import {
  userDataRealOrAnonymizedAtom,
  userPhoneNumberAtom,
} from '../../../state/session/userDataAtoms'
import {getInternationalPhoneNumber} from '../../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {revealContactFromQuickActionBannerAtom} from '../../TradeChecklistFlow/atoms/revealContactAtoms'
import {chatMolecule} from '../atoms'
import {useHideActionForMessage} from '../atoms/createHideActionForMessageMmkvAtom'
import VexlbotActionCard from './VexlbotMessageItem/components/VexlbotActionCard'

const contactRevealAvatarSize = 80
const declinedPhoneSvg = blockPhoneNumberRevealSvg.xml.replace(
  '#EE675E',
  '#FFFFFF'
)

function ContactRevealAvatar({
  image,
  onPress,
}: {
  image: RealLifeInfo['image']
  onPress?: () => void
}): React.JSX.Element {
  const avatar =
    image.type === 'imageUri' ? (
      <Avatar
        customSize={contactRevealAvatarSize}
        source={{uri: resolveLocalUri(image.imageUri)}}
      />
    ) : (
      <Avatar customSize={contactRevealAvatarSize}>
        <SvgXml
          width={contactRevealAvatarSize}
          height={contactRevealAvatarSize}
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

function ContactRevealSide({
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
      <ContactRevealAvatar image={image} onPress={onAvatarPress} />
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

function ContactRevealMessageItem({
  message,
  isLatest,
}: {
  message: ChatMessageWithState
  isLatest: boolean
}): React.ReactElement | null {
  const {t} = useTranslation()
  const {
    openedImageUriAtom,
    otherSideDataAtom,
    contactRevealStatusAtom,
    contactRevealTriggeredFromTradeChecklistAtom,
    publicKeyPemBase64Atom,
    chatIdAtom,
    revealContactWithUiFeedbackAtom,
    isContactAlreadyInContactsListAtom,
    contactRevealRequestMessageIdAtom,
  } = useMolecule(chatMolecule)
  const {image, userName, partialPhoneNumber, fullPhoneNumber} =
    useAtomValue(otherSideDataAtom)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const myRealLifeInfo = useAtomValue(userDataRealOrAnonymizedAtom)
  const myPhoneNumber = useAtomValue(userPhoneNumberAtom)
  const contactRevealStatus = useAtomValue(contactRevealStatusAtom)
  const contactRevealTriggeredFromTradeChecklist = useAtomValue(
    contactRevealTriggeredFromTradeChecklistAtom
  )
  const isContactAlreadyInContactsList = useAtomValue(
    isContactAlreadyInContactsListAtom
  )
  const contactRevealRequestMessageId = useAtomValue(
    contactRevealRequestMessageIdAtom
  )
  const revealContact = useSetAtom(revealContactWithUiFeedbackAtom)
  const revealContactFromQuickActionBanner = useSetAtom(
    revealContactFromQuickActionBannerAtom
  )
  const addRevealedContact = useSetAtom(addContactWithUiFeedbackActionAtom)
  const setOpenedImageUri = useSetAtom(openedImageUriAtom)
  const [contactRevealRequestHidden, hideContactRevealRequest] =
    useHideActionForMessage(contactRevealRequestMessageId)
  const theme = useTheme()

  const isContactRevealRequest =
    message.message.messageType === 'REQUEST_CONTACT_REVEAL' ||
    ((message.state === 'sent' || message.state === 'received') &&
      message.message.tradeChecklistUpdate?.contact?.status ===
        'REQUEST_REVEAL')

  const otherSidePhoneNumberText = fullPhoneNumber
    ? getInternationalPhoneNumber(fullPhoneNumber)
    : partialPhoneNumber

  const onRespondToReveal = (): void => {
    if (contactRevealTriggeredFromTradeChecklist) {
      void revealContactFromQuickActionBanner({chatId, inboxKey})
      return
    }

    void revealContact('RESPOND_REVEAL')
  }

  if (isContactRevealRequest && contactRevealStatus === 'theyAsked') {
    return (
      <VexlbotActionCard
        description="The other person wants to exchange phone numbers"
        statusLabel={t('vexlbot.reactionRequired')}
        title="Do you want to share your phone number?"
      >
        <Button onPress={onRespondToReveal} size="medium" variant="primary">
          {t('common.respond')}
        </Button>
      </VexlbotActionCard>
    )
  }

  if (
    isContactRevealRequest &&
    contactRevealStatus === 'iAsked' &&
    !contactRevealRequestHidden
  ) {
    return (
      <VexlbotActionCard
        description="You asked to exchange phone numbers"
        onClosePress={hideContactRevealRequest}
        title="Phone number request sent"
      >
        <Typography
          color="$foregroundSecondary"
          textAlign="center"
          variant="paragraph"
        >
          We&apos;ll share phone numbers once the other person agrees.
        </Typography>
      </VexlbotActionCard>
    )
  }

  if (
    contactRevealStatus === 'shared' &&
    (message.state === 'received' || message.state === 'sent') &&
    (message.message.messageType === 'APPROVE_CONTACT_REVEAL' ||
      message.message.tradeChecklistUpdate?.contact?.status ===
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
            {t('messages.phoneNumberRevealed')}
          </Typography>
          <XStack alignItems="center" gap="$4" width="100%">
            <ContactRevealSide
              image={myRealLifeInfo.image}
              name={myRealLifeInfo.userName}
              phoneNumber={getInternationalPhoneNumber(myPhoneNumber)}
            />
            <ArrowsHorizontal color={theme.foregroundPrimary.val} size={28} />
            <ContactRevealSide
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
          {!isContactAlreadyInContactsList && fullPhoneNumber ? (
            <TouchableOpacity
              onPress={() => {
                pipe(
                  fullPhoneNumber,
                  Schema.decodeUnknownEither(E164PhoneNumber),
                  E.bindTo('normalizedNumber'),
                  E.bindW('hash', ({normalizedNumber}) =>
                    hashPhoneNumber(normalizedNumber)
                  ),
                  E.map(({normalizedNumber, hash}) => {
                    void addRevealedContact({
                      info: {
                        name: userName,
                        numberToDisplay: fullPhoneNumber,
                        rawNumber: fullPhoneNumber,
                        label: Option.none(),
                        nonUniqueContactId: Option.none(),
                      },
                      computedValues: {
                        hash,
                        normalizedNumber,
                      },
                    }).pipe(effectToEither)
                  }),
                  E.mapLeft((error) => {
                    reportError(
                      'warn',
                      new Error(
                        'Error while adding revealed contact from chat message'
                      ),
                      {
                        error,
                      }
                    )
                  })
                )
              }}
            >
              <XStack
                alignItems="center"
                backgroundColor="$foregroundPrimary"
                borderRadius="$5"
                gap="$2"
                height="$10"
                justifyContent="center"
                paddingHorizontal="$4"
                width="100%"
              >
                <AddUserPersonContact
                  color={theme.backgroundPrimary.val}
                  size={18}
                />
                <Typography color="$backgroundPrimary" variant="paragraph">
                  Add to contacts
                </Typography>
              </XStack>
            </TouchableOpacity>
          ) : null}
        </YStack>
      </YStack>
    )
  }

  if (
    contactRevealStatus === 'denied' &&
    (message.message.messageType === 'DISAPPROVE_CONTACT_REVEAL' ||
      ((message.state === 'sent' || message.state === 'received') &&
        message.message.tradeChecklistUpdate?.contact?.status ===
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
          <YStack
            alignItems="center"
            height={56}
            justifyContent="center"
            width={56}
          >
            <SvgXml height={32} width={32} xml={declinedPhoneSvg} />
          </YStack>
          <Typography color="$foregroundPrimary" variant="paragraphDemibold">
            Unknown phone number
          </Typography>
          <Typography
            color="$foregroundSecondary"
            textAlign="center"
            variant="paragraphSmall"
          >
            {message.state === 'received'
              ? 'The other person declined'
              : 'You declined'}
          </Typography>
        </YStack>
      </YStack>
    )
  }

  return null
}

export default ContactRevealMessageItem
