import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {Image, Stack} from 'tamagui'
import BlockIconSvg from '../../../images/blockIconSvg'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {randomNumberFromSeed} from '../../../utils/randomNumber'
import {randomSeedFromChat} from '../../../utils/RandomSeed'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import avatarsGoldenGlassesAndBackgroundSvg from '../../AnonymousAvatar/images/avatarsGoldenGlassesAndBackgroundSvg'
import avatarsSvg from '../../AnonymousAvatar/images/avatarsSvg'
import SvgImage from '../../Image'
import {revealIdentityFromQuickActionBannerAtom} from '../../TradeChecklistFlow/atoms/revealIdentityAtoms'
import UserAvatar from '../../UserAvatar'
import {chatMolecule} from '../atoms'
import BigIconMessage from './BigIconMessage'

function IdentityRevealMessageItem({
  message,
  isLatest,
}: {
  message: ChatMessageWithState
  isLatest: boolean
}): React.ReactElement | null {
  const {t} = useTranslation()
  const {
    chatAtom,
    identityRevealTriggeredFromTradeChecklistAtom,
    identityRevealStatusAtom,
    otherSideDataAtom,
    revealIdentityWithUiFeedbackAtom,
    publicKeyPemBase64Atom,
    chatIdAtom,
    offerForChatAtom,
    openedImageUriAtom,
  } = useMolecule(chatMolecule)
  const {image, userName, partialPhoneNumber} = useAtomValue(otherSideDataAtom)
  const chat = useAtomValue(chatAtom)
  const chatId = useAtomValue(chatIdAtom)
  const offer = useAtomValue(offerForChatAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const identityRevealStatus = useAtomValue(identityRevealStatusAtom)
  const revealIdentity = useSetAtom(revealIdentityWithUiFeedbackAtom)
  const identityRevealTriggeredFromTradeChecklist = useAtomValue(
    identityRevealTriggeredFromTradeChecklistAtom
  )
  const revealIdentityFromQuickActionBanner = useSetAtom(
    revealIdentityFromQuickActionBannerAtom
  )
  const setOpenedImageUri = useSetAtom(openedImageUriAtom)

  const anonymousAvatars =
    (offer?.offerInfo.publicPart.goldenAvatarType ===
      'BACKGROUND_AND_GLASSES' &&
      !offer.ownershipInfo?.adminId) ||
    !!chat.otherSide.goldenAvatarType
      ? avatarsGoldenGlassesAndBackgroundSvg
      : avatarsSvg

  const anonymousImage = useMemo(
    () =>
      anonymousAvatars[
        randomNumberFromSeed(
          0,
          anonymousAvatars.length - 1,
          randomSeedFromChat(chat)
        )
      ],
    [anonymousAvatars, chat]
  )

  if (
    (message.message.messageType === 'REQUEST_REVEAL' ||
      ((message.state === 'sent' || message.state === 'received') &&
        message.message.tradeChecklistUpdate?.identity?.status ===
          'REQUEST_REVEAL')) &&
    identityRevealStatus !== 'notStarted'
  ) {
    return (
      <BigIconMessage
        isLatest={isLatest}
        smallerText={t('messages.identityRevealRequest')}
        biggerText={t('messages.letsRevealIdentities')}
        icon={
          <UserAvatar
            height={80}
            width={80}
            // @ts-expect-error TODO: typescript error
            userImage={{type: 'svgXml', svgXml: anonymousImage}}
          />
        }
        buttonText={
          identityRevealStatus === 'theyAsked' ? t('common.respond') : undefined
        }
        onButtonPress={
          identityRevealStatus === 'theyAsked'
            ? () => {
                if (identityRevealTriggeredFromTradeChecklist) {
                  void revealIdentityFromQuickActionBanner({chatId, inboxKey})
                } else {
                  void revealIdentity('RESPOND_REVEAL')
                }
              }
            : undefined
        }
      />
    )
  }

  if (
    (message.state === 'received' || message.state === 'sent') &&
    (message.message.messageType === 'APPROVE_REVEAL' ||
      message.message.tradeChecklistUpdate?.identity?.status ===
        'APPROVE_REVEAL')
  ) {
    return (
      <BigIconMessage
        isLatest={isLatest}
        smallerText={t('messages.identityRevealed')}
        biggerText={userName}
        bottomText={partialPhoneNumber}
        icon={
          image.type === 'imageUri' ? (
            <TouchableOpacity
              onPress={() => {
                setOpenedImageUri(resolveLocalUri(image.imageUri))
              }}
            >
              <Image
                height={80}
                width={80}
                borderRadius="$4"
                source={{uri: image.imageUri}}
              />
            </TouchableOpacity>
          ) : (
            <UserAvatar height={80} width={80} userImage={image} />
          )
        }
      />
    )
  }

  if (
    message.message.messageType === 'DISAPPROVE_REVEAL' ||
    ((message.state === 'sent' || message.state === 'received') &&
      message.message.tradeChecklistUpdate?.identity?.status ===
        'DISAPPROVE_REVEAL')
  ) {
    return (
      <BigIconMessage
        isLatest={isLatest}
        smallerText={t('messages.identityRevealRequest')}
        biggerText={
          message.state === 'received'
            ? t('messages.themDeclined', {name: userName})
            : t('messages.youDeclined')
        }
        icon={
          <Stack
            width={80}
            height={80}
            backgroundColor="$darkRed"
            alignItems="center"
            justifyContent="center"
            borderRadius="$7"
          >
            <SvgImage width={35} height={35} source={BlockIconSvg} />
          </Stack>
        }
      />
    )
  }

  return null
}

export default IdentityRevealMessageItem
