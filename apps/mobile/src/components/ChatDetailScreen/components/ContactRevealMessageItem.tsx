import {type ChatMessageWithState} from '../../../state/chat/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useAtomValue, useSetAtom} from 'jotai'
import BigIconMessage from './BigIconMessage'
import UserAvatarTouchableWrapper from './UserAvatarTouchableWrapper'
import {Image, Stack} from 'tamagui'
import UserAvatar from '../../UserAvatar'
import SvgImage from '../../Image'
import React from 'react'
import blockPhoneNumberRevealSvg from '../../../images/blockPhoneNumberRevealSvg'
import {E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import {addContactWithUiFeedbackAtom} from '../../../state/contacts/atom/addContactWithUiFeedbackAtom'
import resolveLocalUri from '../../../utils/resolveLocalUri'

function RevealedContactMessageItem({
  direction,
  isLatest,
  message,
}: {
  direction: 'incoming' | 'outgoing'
  isLatest: boolean
  message: ChatMessageWithState
}): JSX.Element {
  const {t} = useTranslation()

  const {otherSideDataAtom} = useMolecule(chatMolecule)
  const {image} = useAtomValue(otherSideDataAtom)
  const addRevealedContact = useSetAtom(addContactWithUiFeedbackAtom)

  return (
    <BigIconMessage
      isLatest={isLatest}
      smallerText={t('messages.phoneNumberRevealed')}
      biggerText={message.message.deanonymizedUser?.fullPhoneNumber ?? ''}
      bottomText={message.message.deanonymizedUser?.name}
      onTextPress={() => {
        void addRevealedContact({
          name: message.message.deanonymizedUser?.fullPhoneNumber ?? '',
          normalizedNumber: E164PhoneNumber.parse(
            message.message.deanonymizedUser?.fullPhoneNumber
          ),
          fromContactList: false,
          numberToDisplay:
            message.message.deanonymizedUser?.fullPhoneNumber ?? '',
        })
      }}
      icon={
        direction === 'incoming' && image.type === 'imageUri' ? (
          <UserAvatarTouchableWrapper
            userImageUri={resolveLocalUri(image.imageUri)}
          >
            <Image
              height={80}
              width={80}
              borderRadius={'$8'}
              src={{uri: resolveLocalUri(image.imageUri)}}
            />
          </UserAvatarTouchableWrapper>
        ) : (
          <UserAvatar height={80} width={80} userImage={image} />
        )
      }
    />
  )
}

function ContactRevealMessageItem({
  message,
  isLatest,
  direction,
}: {
  message: ChatMessageWithState
  isLatest: boolean
  direction: 'incoming' | 'outgoing'
}): JSX.Element | null {
  const {t} = useTranslation()
  const {otherSideDataAtom, contactRevealStatusAtom} = useMolecule(chatMolecule)
  const {image, userName} = useAtomValue(otherSideDataAtom)
  const contactRevealStatus = useAtomValue(contactRevealStatusAtom)

  if (
    contactRevealStatus === 'denied' &&
    message.message.messageType !== 'DISAPPROVE_CONTACT_REVEAL'
  ) {
    return null
  }

  if (
    message.message.messageType === 'REQUEST_CONTACT_REVEAL' &&
    (contactRevealStatus === 'iAsked' ||
      contactRevealStatus === 'theyAsked' ||
      (contactRevealStatus === 'shared' && message.state === 'received'))
  ) {
    if (contactRevealStatus === 'shared') {
      return (
        <RevealedContactMessageItem
          direction={direction}
          isLatest={isLatest}
          message={message}
        />
      )
    }

    return (
      <BigIconMessage
        isLatest={isLatest}
        smallerText={message.message.deanonymizedUser?.name ?? ''}
        biggerText={t('messages.letsExchangeContacts')}
        bottomText={message.message.deanonymizedUser?.partialPhoneNumber}
        icon={<UserAvatar height={80} width={80} userImage={image} />}
      />
    )
  }

  if (
    message.message.messageType === 'APPROVE_CONTACT_REVEAL' &&
    message.state === 'received'
  ) {
    return (
      <RevealedContactMessageItem
        direction={direction}
        isLatest={isLatest}
        message={message}
      />
    )
  }

  if (message.message.messageType === 'DISAPPROVE_CONTACT_REVEAL') {
    return (
      <BigIconMessage
        isLatest={isLatest}
        smallerText={t('messages.contactRevealRequest')}
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
            <SvgImage
              width={35}
              height={35}
              source={blockPhoneNumberRevealSvg}
            />
          </Stack>
        }
      />
    )
  }

  return null
}

export default ContactRevealMessageItem
