import Clipboard from '@react-native-clipboard/clipboard'
import {useMolecule} from 'bunshi/dist/react'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {Image, Stack} from 'tamagui'
import {E164PhoneNumber} from '../../../../../../packages/domain/src/general/E164PhoneNumber.brand'
import {type ChatMessage} from '../../../../../../packages/domain/src/general/messaging'
import blockPhoneNumberRevealSvg from '../../../images/blockPhoneNumberRevealSvg'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {addContactWithUiFeedbackAtom} from '../../../state/contacts/atom/addContactWithUiFeedbackAtom'
import {hashPhoneNumber} from '../../../state/contacts/utils'
import {safeParse} from '../../../utils/fpUtils'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import SvgImage from '../../Image'
import {toastNotificationAtom} from '../../ToastNotification'
import {revealContactFromQuickActionBannerAtom} from '../../TradeChecklistFlow/atoms/revealContactAtoms'
import UserAvatar from '../../UserAvatar'
import {chatMolecule} from '../atoms'
import BigIconMessage from './BigIconMessage'
import UserAvatarTouchableWrapper from './UserAvatarTouchableWrapper'
import checkIconSvg from './images/checkIconSvg'

function RevealedContactMessageItem({
  direction,
  isLatest,
  message,
}: {
  direction: 'incoming' | 'outgoing'
  isLatest: boolean
  message: ChatMessage
}): JSX.Element {
  const {t} = useTranslation()

  const {otherSideDataAtom, isContactAlreadyInContactsListAtom} =
    useMolecule(chatMolecule)
  const {image, userName, fullPhoneNumber} = useAtomValue(otherSideDataAtom)
  const addRevealedContact = useSetAtom(addContactWithUiFeedbackAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const isContactAlreadyInContactsList = useAtomValue(
    isContactAlreadyInContactsListAtom
  )

  return (
    <BigIconMessage
      isLatest={isLatest}
      smallerText={t('messages.phoneNumberRevealed')}
      biggerText={fullPhoneNumber}
      bottomText={userName}
      onCopyToClipboardPress={() => {
        Clipboard.setString(fullPhoneNumber ?? '')
        setToastNotification({
          text: t('common.copied'),
          icon: checkIconSvg,
        })
      }}
      buttonText={
        !isContactAlreadyInContactsList
          ? t('addContactDialog.addContact')
          : undefined
      }
      onButtonPress={
        !isContactAlreadyInContactsList
          ? () => {
              pipe(
                message.deanonymizedUser?.fullPhoneNumber,
                safeParse(E164PhoneNumber),
                E.bindTo('normalizedNumber'),
                E.bindW('hash', ({normalizedNumber}) =>
                  hashPhoneNumber(normalizedNumber)
                ),
                E.map(({normalizedNumber, hash}) => {
                  void addRevealedContact({
                    info: {
                      name: message.deanonymizedUser?.fullPhoneNumber ?? '',
                      numberToDisplay:
                        message.deanonymizedUser?.fullPhoneNumber ?? '',
                      rawNumber:
                        message.deanonymizedUser?.fullPhoneNumber ?? '',
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
                    new Error(
                      'Error while adding reveledContact from chat message'
                    ),
                    {
                      l,
                    }
                  )
                })
              )
            }
          : undefined
      }
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
  const {
    otherSideDataAtom,
    contactRevealStatusAtom,
    contactRevealTriggeredFromTradeChecklistAtom,
    publicKeyPemBase64Atom,
    chatIdAtom,
    revealContactWithUiFeedbackAtom,
  } = useMolecule(chatMolecule)
  const {image, userName, partialPhoneNumber} = useAtomValue(otherSideDataAtom)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const contactRevealStatus = useAtomValue(contactRevealStatusAtom)
  const contactRevealTriggeredFromTradeChecklist = useAtomValue(
    contactRevealTriggeredFromTradeChecklistAtom
  )

  const revealContact = useSetAtom(revealContactWithUiFeedbackAtom)
  const revealContactFromQuickActionBanner = useSetAtom(
    revealContactFromQuickActionBannerAtom
  )

  if (
    (message.message.messageType === 'REQUEST_CONTACT_REVEAL' ||
      ((message.state === 'sent' || message.state === 'received') &&
        message.message.tradeChecklistUpdate?.contact?.status ===
          'REQUEST_REVEAL')) &&
    contactRevealStatus !== 'notStarted'
  ) {
    return (
      <BigIconMessage
        isLatest={isLatest}
        smallerText={userName ?? ''}
        biggerText={t('messages.letsExchangeContacts')}
        bottomText={partialPhoneNumber}
        icon={<UserAvatar height={80} width={80} userImage={image} />}
        buttonText={
          contactRevealStatus === 'theyAsked' ? t('common.respond') : undefined
        }
        onButtonPress={() => {
          if (contactRevealTriggeredFromTradeChecklist) {
            void revealContactFromQuickActionBanner({chatId, inboxKey})
          } else {
            void revealContact('RESPOND_REVEAL')
          }
        }}
      />
    )
  }

  if (
    (message.state === 'received' || message.state === 'sent') &&
    (message.message.messageType === 'APPROVE_CONTACT_REVEAL' ||
      message.message.tradeChecklistUpdate?.contact?.status ===
        'APPROVE_REVEAL')
  ) {
    return (
      <RevealedContactMessageItem
        direction={direction}
        isLatest={isLatest}
        message={message.message}
      />
    )
  }

  if (
    message.message.messageType === 'DISAPPROVE_CONTACT_REVEAL' ||
    ((message.state === 'sent' || message.state === 'received') &&
      message.message.tradeChecklistUpdate?.contact?.status ===
        'DISAPPROVE_REVEAL')
  ) {
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
