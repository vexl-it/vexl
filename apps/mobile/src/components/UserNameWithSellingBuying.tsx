import {styled, Text} from 'tamagui'
import React from 'react'
import {useTranslation} from '../utils/localization/I18nProvider'
import {type OfferType} from '@vexl-next/domain/dist/general/offers'

const AfterNameBasicText = styled(Text, {
  fs: 16,
  ff: '$body600',
})

function AfterNameText({
  offerType,
  offerDirection,
}: {
  offerType: OfferType
  offerDirection: 'theirOffer' | 'myOffer'
}): JSX.Element {
  const {t} = useTranslation()

  if (offerDirection === 'myOffer') {
    if (offerType === 'SELL') {
      return (
        <AfterNameBasicText color="$pink">
          {t('messages.isBuying')}
        </AfterNameBasicText>
      )
    } else {
      return (
        <AfterNameBasicText color="$pastelGreen">
          {t('messages.isSelling')}
        </AfterNameBasicText>
      )
    }
  } else {
    if (offerType === 'BUY') {
      return (
        <AfterNameBasicText color="$pink">
          {t('messages.isSelling')}
        </AfterNameBasicText>
      )
    } else {
      return (
        <AfterNameBasicText color="$pastelGreen">
          {t('messages.isBuying')}
        </AfterNameBasicText>
      )
    }
  }
}

function UserNameWithSellingBuying({
  userName,
  center,
  offerInfo,
}: {
  userName: string
  center?: boolean
  offerInfo?: {
    offerType: OfferType
    offerDirection: 'theirOffer' | 'myOffer'
  }
}): JSX.Element {
  const {t} = useTranslation()
  return (
    <Text
      textAlign={center ? 'center' : 'left'}
      fos={16}
      color="$white"
      ff="$body600"
    >
      {userName}{' '}
      {offerInfo ? (
        <AfterNameText {...offerInfo} />
      ) : (
        <AfterNameBasicText color="$greyOnBlack">
          {t('messages.offerDeleted')}
        </AfterNameBasicText>
      )}
    </Text>
  )
}

export default UserNameWithSellingBuying
