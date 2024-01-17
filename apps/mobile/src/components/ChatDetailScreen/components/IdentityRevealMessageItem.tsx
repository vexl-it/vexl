import BigIconMessage from './BigIconMessage'
import {Image, Stack} from 'tamagui'
import UserAvatar from '../../UserAvatar'
import React from 'react'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useAtomValue} from 'jotai'
import SvgImage from '../../Image'
import {useMolecule} from 'bunshi/dist/react'
import {chatMolecule} from '../atoms'
import BlockIconSvg from '../../../images/blockIconSvg'
import UserAvatarTouchableWrapper from './UserAvatarTouchableWrapper'
import resolveLocalUri from '../../../utils/resolveLocalUri'

function IdentityRevealMessageItem({
  message,
  isLatest,
  direction,
}: {
  message: ChatMessageWithState
  isLatest: boolean
  direction: 'incoming' | 'outgoing'
}): JSX.Element | null {
  const {t} = useTranslation()
  const {otherSideDataAtom, identityRevealStatusAtom} =
    useMolecule(chatMolecule)
  const {image, userName} = useAtomValue(otherSideDataAtom)
  const identityRevealStatus = useAtomValue(identityRevealStatusAtom)

  if (
    identityRevealStatus === 'denied' &&
    message.message.messageType !== 'DISAPPROVE_REVEAL'
  ) {
    return null
  }

  if (
    message.message.messageType === 'REQUEST_REVEAL' &&
    (identityRevealStatus === 'iAsked' ||
      identityRevealStatus === 'theyAsked' ||
      (identityRevealStatus === 'shared' && message.state === 'received'))
  ) {
    if (identityRevealStatus === 'shared') {
      return (
        <BigIconMessage
          isLatest={isLatest}
          smallerText={t('messages.identityRevealed')}
          biggerText={message.message.deanonymizedUser?.name ?? ''}
          bottomText={message.message.deanonymizedUser?.partialPhoneNumber}
          icon={
            direction === 'incoming' && message.message.image ? (
              <UserAvatarTouchableWrapper
                userImageUri={resolveLocalUri(message.message.image)}
              >
                <Image
                  height={80}
                  width={80}
                  borderRadius={'$8'}
                  source={{uri: resolveLocalUri(message.message.image)}}
                />
              </UserAvatarTouchableWrapper>
            ) : (
              <UserAvatar height={80} width={80} userImage={image} />
            )
          }
        />
      )
    }

    return (
      <BigIconMessage
        isLatest={isLatest}
        smallerText={t('messages.identityRevealRequest')}
        biggerText={t('messages.letsRevealIdentities')}
        icon={<UserAvatar height={80} width={80} userImage={image} />}
      />
    )
  }

  if (
    message.message.messageType === 'APPROVE_REVEAL' &&
    message.state === 'received'
  ) {
    return (
      <BigIconMessage
        isLatest={isLatest}
        smallerText={t('messages.identityRevealed')}
        biggerText={message.message.deanonymizedUser?.name ?? ''}
        bottomText={message.message.deanonymizedUser?.partialPhoneNumber}
        icon={
          direction === 'incoming' && message.message.image ? (
            <UserAvatarTouchableWrapper userImageUri={message.message.image}>
              <Image
                height={80}
                width={80}
                borderRadius={'$8'}
                source={{uri: message.message.image}}
              />
            </UserAvatarTouchableWrapper>
          ) : (
            <UserAvatar height={80} width={80} userImage={image} />
          )
        }
      />
    )
  }

  if (message.message.messageType === 'DISAPPROVE_REVEAL') {
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
            backgroundColor={'$darkRed'}
            alignItems="center"
            justifyContent={'center'}
            borderRadius={'$7'}
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
