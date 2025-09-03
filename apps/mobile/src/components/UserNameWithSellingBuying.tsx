import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import React from 'react'
import {Text, styled} from 'tamagui'
import {useTranslation} from '../utils/localization/I18nProvider'

const AfterNameBasicText = styled(Text, {
  fs: 16,
  ff: '$body600',
})

function getOtherSideIsBuyingOrSelling(
  offerInfo: OfferInfo
): 'isSelling' | 'isBuying' {
  const {offerType, listingType} = offerInfo.publicPart
  const isMyOffer = !!offerInfo.privatePart.adminId

  if (listingType === 'BITCOIN') {
    if (isMyOffer) {
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
  } else {
    if (isMyOffer) {
      if (offerType !== 'SELL') {
        return 'isBuying'
      } else {
        return 'isSelling'
      }
    } else {
      if (offerType !== 'SELL') {
        return 'isSelling'
      } else {
        return 'isBuying'
      }
    }
  }
}

function AfterNameText({
  offerInfo,
}: {
  offerInfo: OfferInfo
}): React.ReactElement {
  const {t} = useTranslation()

  const buyingOrSelling = getOtherSideIsBuyingOrSelling(offerInfo)
  const color = buyingOrSelling === 'isBuying' ? '$pink' : '$green'

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
  offerInfo?: OfferInfo
}): React.ReactElement {
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
        <AfterNameText offerInfo={offerInfo} />
      ) : (
        <AfterNameBasicText color="$greyOnBlack">
          {t('messages.offerDeleted')}
        </AfterNameBasicText>
      )}
    </Text>
  )
}

export default UserNameWithSellingBuying
