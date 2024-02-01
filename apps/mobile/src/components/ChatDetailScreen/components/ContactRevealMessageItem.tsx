import Clipboard from '@react-native-clipboard/clipboard'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {safeParse} from '@vexl-next/resources-utils/src/utils/parsing'
import {useMolecule} from 'bunshi/dist/react'
import * as E from 'fp-ts/lib/Either'
import {pipe} from 'fp-ts/lib/function'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {Image, Stack} from 'tamagui'
import blockPhoneNumberRevealSvg from '../../../images/blockPhoneNumberRevealSvg'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {addContactWithUiFeedbackAtom} from '../../../state/contacts/atom/addContactWithUiFeedbackAtom'
import {hashPhoneNumber} from '../../../state/contacts/utils'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import SvgImage from '../../Image'
import UserAvatar from '../../UserAvatar'
import {chatMolecule} from '../atoms'
import BigIconMessage from './BigIconMessage'
import UserAvatarTouchableWrapper from './UserAvatarTouchableWrapper'

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
  const {image, userName} = useAtomValue(otherSideDataAtom)
  const addRevealedContact = useSetAtom(addContactWithUiFeedbackAtom)

  return (
    <BigIconMessage
      isLatest={isLatest}
      smallerText={t('messages.phoneNumberRevealed')}
      biggerText={message.message.deanonymizedUser?.fullPhoneNumber ?? ''}
      bottomText={userName}
      onCopyToClipboardPress={() => {
        Clipboard.setString(
          message.message.deanonymizedUser?.fullPhoneNumber ?? ''
        )
      }}
      onPress={() => {
        pipe(
          message.message.deanonymizedUser?.fullPhoneNumber,
          safeParse(E164PhoneNumber),
          E.bindTo('normalizedNumber'),
          E.bindW('hash', ({normalizedNumber}) =>
            hashPhoneNumber(normalizedNumber)
          ),
          E.map(({normalizedNumber, hash}) => {
            void addRevealedContact({
              info: {
                name: message.message.deanonymizedUser?.fullPhoneNumber ?? '',
                numberToDisplay:
                  message.message.deanonymizedUser?.fullPhoneNumber ?? '',
                rawNumber:
                  message.message.deanonymizedUser?.fullPhoneNumber ?? '',
              },
              computedValues: {
                hash,
                normalizedNumber,
              },
            })
          }),
          E.mapLeft((l) => {
            reportError(
              'warn',
              new Error('Error while adding reveledContact from chat message'),
              {
                l,
              }
            )
          })
        )
      }}
      icon={
        direction === 'incoming' && image.type === 'imageUri' ? (
          <UserAvatarTouchableWrapper
            userImageUri={resolveLocalUri(image.imageUri)}
          >
            <Image
              height={80}
              width={80}
              borderRadius="$8"
              source={{uri: resolveLocalUri(image.imageUri)}}
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
  const {image, userName, partialPhoneNumber} = useAtomValue(otherSideDataAtom)
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
        smallerText={userName ?? ''}
        biggerText={t('messages.letsExchangeContacts')}
        bottomText={partialPhoneNumber}
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
            backgroundColor="$darkRed"
            alignItems="center"
            justifyContent="center"
            borderRadius="$7"
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
