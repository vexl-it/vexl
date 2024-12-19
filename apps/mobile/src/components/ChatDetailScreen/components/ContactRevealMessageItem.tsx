import Clipboard from '@react-native-clipboard/clipboard'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type ChatMessage} from '@vexl-next/domain/src/general/messaging'
import {useMolecule} from 'bunshi/dist/react'
import * as E from 'fp-ts/Either'
import {pipe} from 'fp-ts/function'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {TouchableOpacity} from 'react-native'
import {Image, Stack} from 'tamagui'
import blockPhoneNumberRevealSvg from '../../../images/blockPhoneNumberRevealSvg'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import {addContactWithUiFeedbackAtom} from '../../../state/contacts/atom/addContactWithUiFeedbackAtom'
import {hashPhoneNumber} from '../../../state/contacts/utils'
import {safeParse} from '../../../utils/fpUtils'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import reportError from '../../../utils/reportError'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {showGoldenAvatarInfoModalActionAton} from '../../GoldenAvatar/atoms'
import SvgImage from '../../Image'
import {toastNotificationAtom} from '../../ToastNotification/atom'
import {revealContactFromQuickActionBannerAtom} from '../../TradeChecklistFlow/atoms/revealContactAtoms'
import UserAvatar from '../../UserAvatar'
import {chatMolecule} from '../atoms'
import BigIconMessage from './BigIconMessage'
import checkIconSvg from './images/checkIconSvg'

function RevealedContactMessageItem({
  isLatest,
}: {
  isLatest: boolean
  message: ChatMessage
}): JSX.Element {
  const {t} = useTranslation()

  const {
    offerForChatAtom,
    openedImageUriAtom,
    otherSideDataAtom,
    isContactAlreadyInContactsListAtom,
  } = useMolecule(chatMolecule)
  const offer = useAtomValue(offerForChatAtom)
  const {image, userName, fullPhoneNumber} = useAtomValue(otherSideDataAtom)
  const addRevealedContact = useSetAtom(addContactWithUiFeedbackAtom)
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const isContactAlreadyInContactsList = useAtomValue(
    isContactAlreadyInContactsListAtom
  )
  const setOpenedImageUri = useSetAtom(openedImageUriAtom)
  const showGoldenAvatarInfoModal = useSetAtom(
    showGoldenAvatarInfoModalActionAton
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
          visible: true,
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
                fullPhoneNumber,
                safeParse(E164PhoneNumber),
                E.bindTo('normalizedNumber'),
                E.bindW('hash', ({normalizedNumber}) =>
                  hashPhoneNumber(normalizedNumber)
                ),
                E.map(({normalizedNumber, hash}) => {
                  void addRevealedContact({
                    info: {
                      name: fullPhoneNumber ?? '',
                      numberToDisplay: fullPhoneNumber ?? '',
                      rawNumber: fullPhoneNumber ?? '',
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
              source={{uri: resolveLocalUri(image.imageUri)}}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            disabled={!offer?.offerInfo.publicPart.goldenAvatarType}
            onPress={showGoldenAvatarInfoModal}
          >
            <UserAvatar height={80} width={80} userImage={image} />
          </TouchableOpacity>
        )
      }
    />
  )
}

function ContactRevealMessageItem({
  message,
  isLatest,
}: {
  message: ChatMessageWithState
  isLatest: boolean
}): JSX.Element | null {
  const {t} = useTranslation()
  const {
    openedImageUriAtom,
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
  const setOpenedImageUri = useSetAtom(openedImageUriAtom)

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
