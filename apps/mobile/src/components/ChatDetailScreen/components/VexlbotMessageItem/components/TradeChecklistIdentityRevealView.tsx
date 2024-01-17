import {useMolecule} from 'bunshi/dist/react'
import {chatMolecule} from '../../../atoms'
import * as identity from '../../../../../state/tradeChecklist/utils/identity'
import {useAtomValue} from 'jotai'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import BigIconMessage from '../../BigIconMessage'
import UserAvatarTouchableWrapper from '../../UserAvatarTouchableWrapper'
import resolveLocalUri from '../../../../../utils/resolveLocalUri'
import {Image, Stack} from 'tamagui'
import UserAvatar from '../../../../UserAvatar'
import React from 'react'
import SvgImage from '../../../../Image'
import BlockIconSvg from '../../../../../images/blockIconSvg'
import {useNavigation} from '@react-navigation/native'

function TradeChecklistIdentityRevealView(): JSX.Element | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {
    chatIdAtom,
    publicKeyPemBase64Atom,
    otherSideDataAtom,
    tradeChecklistIdentityRevealAtom,
  } = useMolecule(chatMolecule)
  const {image, userName} = useAtomValue(otherSideDataAtom)
  const identityData = useAtomValue(tradeChecklistIdentityRevealAtom)
  const chatId = useAtomValue(chatIdAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const identityDataToDisplay = identity.getIdentityData(identityData)

  if (!identityDataToDisplay?.identity) return null

  if (identityDataToDisplay.identity.status === 'REQUEST_REVEAL') {
    return (
      <BigIconMessage
        isLatest
        smallerText={t('messages.identityRevealRequest')}
        biggerText={t('messages.letsRevealIdentities')}
        icon={<UserAvatar height={80} width={80} userImage={image} />}
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

  if (identityDataToDisplay.identity.status === 'APPROVE_REVEAL') {
    return (
      <BigIconMessage
        isLatest
        smallerText={t('messages.identityRevealed')}
        biggerText={identityDataToDisplay.identity.deanonymizedUser?.name ?? ''}
        bottomText={
          identityDataToDisplay.identity.deanonymizedUser?.partialPhoneNumber
        }
        icon={
          identityDataToDisplay.identity.image ? (
            <UserAvatarTouchableWrapper
              userImageUri={resolveLocalUri(
                identityDataToDisplay.identity.image
              )}
            >
              <Image
                height={80}
                width={80}
                borderRadius={'$8'}
                source={{
                  uri: resolveLocalUri(identityDataToDisplay.identity.image),
                }}
              />
            </UserAvatarTouchableWrapper>
          ) : (
            <UserAvatar height={80} width={80} userImage={image} />
          )
        }
      />
    )
  }

  if (identityDataToDisplay.identity.status === 'DISAPPROVE_REVEAL') {
    return (
      <BigIconMessage
        isLatest
        smallerText={t('messages.identityRevealRequest')}
        biggerText={
          identityDataToDisplay.by === 'them'
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

export default TradeChecklistIdentityRevealView
