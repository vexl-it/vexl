import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {Image, Stack} from 'tamagui'
import BlockIconSvg from '../../../images/blockIconSvg'
import {generateOtherSideSeed} from '../../../state/chat/atoms/selectOtherSideDataAtom'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {randomNumberFromSeed} from '../../../utils/randomNumber'
import avatarsSvg from '../../AnonymousAvatar/images/avatarsSvg'
import SvgImage from '../../Image'
import {revealIdentityFromQuickActionBannerAtom} from '../../TradeChecklistFlow/atoms/revealIdentityAtoms'
import UserAvatar from '../../UserAvatar'
import {chatMolecule} from '../atoms'
import BigIconMessage from './BigIconMessage'
import UserAvatarTouchableWrapper from './UserAvatarTouchableWrapper'

function IdentityRevealMessageItem({
  message,
  isLatest,
}: {
  message: ChatMessageWithState
  isLatest: boolean
}): JSX.Element | null {
  const {t} = useTranslation()
  const {
    chatAtom,
    identityRevealTriggeredFromTradeChecklistAtom,
    identityRevealStatusAtom,
    otherSideDataAtom,
    revealIdentityWithUiFeedbackAtom,
    publicKeyPemBase64Atom,
    chatIdAtom,
  } = useMolecule(chatMolecule)
  const {image, userName, partialPhoneNumber} = useAtomValue(otherSideDataAtom)
  const chat = useAtomValue(chatAtom)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const identityRevealStatus = useAtomValue(identityRevealStatusAtom)
  const revealIdentity = useSetAtom(revealIdentityWithUiFeedbackAtom)
  const identityRevealTriggeredFromTradeChecklist = useAtomValue(
    identityRevealTriggeredFromTradeChecklistAtom
  )
  const revealIdentityFromQuickActionBanner = useSetAtom(
    revealIdentityFromQuickActionBannerAtom
  )

  const anonymousImage = useMemo(
    () =>
      avatarsSvg[
        randomNumberFromSeed(
          0,
          avatarsSvg.length - 1,
          generateOtherSideSeed(chat)
        )
      ],
    [chat]
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
            <UserAvatarTouchableWrapper userImageUri={image.imageUri}>
              <Image
                height={80}
                width={80}
                borderRadius="$4"
                source={{uri: image.imageUri}}
              />
            </UserAvatarTouchableWrapper>
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
