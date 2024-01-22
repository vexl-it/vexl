import {type OfferType} from '@vexl-next/domain/src/general/offers'
import React from 'react'
import {styled, Text} from 'tamagui'
import {useTranslation} from '../utils/localization/I18nProvider'

const AfterNameBasicText = styled(Text, {
  fs: 16,
  ff: '$body600',
})

function getOtherSideIsBuyingOrSelling({
  offerType,
  offerDirection,
}: {
  offerType: 'BUY' | 'SELL'
  offerDirection: 'theirOffer' | 'myOffer'
}): 'isSelling' | 'isBuying' {
  if (offerDirection === 'myOffer') {
    if (offerType === 'SELL') {
      return 'isBuying'
    } else {
      return 'isSelling'
    }
  } else {
    if (offerType === 'SELL') {
      return 'isSelling'
    } else {
      return 'isBuying'
    }
  }
}

function AfterNameText({
  offerType,
  offerDirection,
}: {
  offerType: OfferType
  offerDirection: 'theirOffer' | 'myOffer'
}): JSX.Element {
  const {t} = useTranslation()

  const buyingOrSelling = getOtherSideIsBuyingOrSelling({
    offerType,
    offerDirection,
  })
  const color = buyingOrSelling === 'isBuying' ? '$pink' : '$pastelGreen'

  return (
    <AfterNameBasicText color={color}>
      {t(`messages.${buyingOrSelling}`)}
    </AfterNameBasicText>
  )
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
