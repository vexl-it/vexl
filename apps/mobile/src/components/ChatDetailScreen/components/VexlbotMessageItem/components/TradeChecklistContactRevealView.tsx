import {useMolecule} from 'jotai-molecules'
import Clipboard from '@react-native-clipboard/clipboard'
import {chatMolecule} from '../../../atoms'
import * as contact from '../../../../../state/tradeChecklist/utils/contact'
import {useAtomValue, useSetAtom} from 'jotai'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {addContactWithUiFeedbackAtom} from '../../../../../state/contacts/atom/addContactWithUiFeedbackAtom'
import BigIconMessage from '../../BigIconMessage'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import UserAvatarTouchableWrapper from '../../UserAvatarTouchableWrapper'
import resolveLocalUri from '../../../../../utils/resolveLocalUri'
import {Image, Stack} from 'tamagui'
import UserAvatar from '../../../../UserAvatar'
import React from 'react'
import SvgImage from '../../../../Image'
import blockPhoneNumberRevealSvg from '../../../../../images/blockPhoneNumberRevealSvg'
import {useNavigation} from '@react-navigation/native'

function RevealedContactMessageItem({
  direction,
  isLatest,
}: {
  direction: 'incoming' | 'outgoing'
  isLatest: boolean
}): JSX.Element {
  const {t} = useTranslation()

  const {otherSideDataAtom} = useMolecule(chatMolecule)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const addRevealedContact = useSetAtom(addContactWithUiFeedbackAtom)

  return (
    <BigIconMessage
      isLatest={isLatest}
      smallerText={t('messages.phoneNumberRevealed')}
      biggerText={otherSideData.fullPhoneNumber ?? ''}
      bottomText={otherSideData.userName}
      onCopyToClipboardPress={() => {
        Clipboard.setString(otherSideData.fullPhoneNumber ?? '')
      }}
      onPress={() => {
        void addRevealedContact({
          name: otherSideData.fullPhoneNumber ?? '',
          normalizedNumber: E164PhoneNumber.parse(
            otherSideData.fullPhoneNumber
          ),
          fromContactList: false,
          numberToDisplay: otherSideData.fullPhoneNumber ?? '',
        })
      }}
      icon={
        direction === 'incoming' && otherSideData.image.type === 'imageUri' ? (
          <UserAvatarTouchableWrapper
            userImageUri={resolveLocalUri(otherSideData.image.imageUri)}
          >
            <Image
              height={80}
              width={80}
              borderRadius={'$8'}
              source={{uri: resolveLocalUri(otherSideData.image.imageUri)}}
            />
          </UserAvatarTouchableWrapper>
        ) : (
          <UserAvatar height={80} width={80} userImage={otherSideData.image} />
        )
      }
    />
  )
}

function TradeChecklistContactRevealView(): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {
    chatIdAtom,
    publicKeyPemBase64Atom,
    otherSideDataAtom,
    tradeChecklistContactRevealAtom,
  } = useMolecule(chatMolecule)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const contactData = useAtomValue(tradeChecklistContactRevealAtom)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const contactDataToDisplay = contact.getContactData(contactData)

  if (!contactDataToDisplay?.contact) return null

  if (contactDataToDisplay.contact.status === 'REQUEST_REVEAL') {
    return (
      <BigIconMessage
        isLatest
        smallerText={otherSideData.userName ?? ''}
        biggerText={t('messages.letsExchangeContacts')}
        bottomText={otherSideData.partialPhoneNumber}
        icon={
          <UserAvatar height={80} width={80} userImage={otherSideData.image} />
        }
        onPress={() => {
          navigation.navigate('TradeChecklistFlow', {
            screen: 'AgreeOnTradeDetails',
            chatId,
            inboxKey,
          })
        }}
      />
    )
  }

  if (contactDataToDisplay.contact.status === 'APPROVE_REVEAL') {
    return (
      <RevealedContactMessageItem
        isLatest
        direction={contactDataToDisplay.by === 'them' ? 'incoming' : 'outgoing'}
      />
    )
  }

  if (contactDataToDisplay.contact.status === 'DISAPPROVE_REVEAL') {
    return (
      <BigIconMessage
        isLatest
        smallerText={t('messages.contactRevealRequest')}
        biggerText={
          contactDataToDisplay.by === 'them'
            ? t('messages.themDeclined', {name: otherSideData.userName})
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

export default TradeChecklistContactRevealView
