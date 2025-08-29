import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import React from 'react'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import pauseSvg from '../../images/pauseSvg'
import {useGetAllClubsForIds} from '../../state/clubs/atom/clubsWithMembersAtom'
import {isOfferExpired} from '../../utils/isOfferExpired'
import {useTranslation} from '../../utils/localization/I18nProvider'
import CommonFriends from '../CommonFriends'
import SvgImage, {ImageUniversal} from '../Image'
import clockSvg from '../images/clockSvg'
import infoSvg from '../images/infoSvg'
import BtcOfferColumns from './components/BtcOfferColumns'
import ProductAndOtherOfferColumns from './components/ProductAndOtherOfferColumns'

// const BTC_PRAGUE_FRIEND = '8o5OvkfRga/xBYbfb0e0MJZIjy4g7xGVimCdNLrydGs='
// const BTC_PRAGUE_FRIEND_STAGE = '9c6r0q7LCn1oqES2pfqQDVQH91fY8ZHYcJKbJYOU7hE='

function OfferInfoPreview({
  showListingType,
  isMine,
  offer,
  onGrayBackground,
  negative,
  reduceDescriptionLength,
  showCommonFriends,
  displayAsPreview,
}: {
  showListingType?: boolean
  isMine?: boolean
  offer: OfferInfo
  onGrayBackground?: boolean
  negative?: boolean
  reduceDescriptionLength?: boolean
  showCommonFriends?: boolean
  displayAsPreview?: boolean
}): React.ReactElement {
  const {t} = useTranslation()
  const clubsForOffer = useGetAllClubsForIds(
    (isMine ? offer.privatePart.intendedClubs : offer.privatePart.clubIds) ?? []
  )

  return (
    <Stack gap="$2">
      <XStack
        ai="center"
        jc={!!isMine || showListingType ? 'space-between' : 'flex-start'}
      >
        {!!(!!isMine || showListingType) && !!offer.publicPart.listingType && (
          <Stack
            ai="center"
            jc="center"
            bc={onGrayBackground ? '$greyAccent3' : '$greyAccent5'}
            py="$1"
            px="$2"
            br="$2"
          >
            <Text fos={12} col="$greyOnWhite" ff="$body600">
              {t(`offerForm.${offer.publicPart.listingType}`)}
            </Text>
          </Stack>
        )}
        <XStack gap="$2">
          {isOfferExpired(offer.publicPart.expirationDate) && (
            <SvgImage
              stroke={getTokens().color.$greyOnBlack.val}
              source={clockSvg}
            />
          )}
          {!offer.publicPart.active && !displayAsPreview && (
            <SvgImage
              stroke={getTokens().color.$greyOnBlack.val}
              source={pauseSvg}
            />
          )}
          {clubsForOffer.length > 0 && (
            <XStack ai="center" gap="$2">
              {clubsForOffer.map((club) => (
                <ImageUniversal
                  key={club.uuid}
                  height={32}
                  width={32}
                  style={{borderRadius: 8}}
                  source={{
                    type: 'imageUri',
                    imageUri: club.clubImageUrl,
                  }}
                />
              ))}
            </XStack>
          )}
        </XStack>
      </XStack>
      {!!isMine && !offer.publicPart.listingType && (
        <XStack ai="center" gap="$2" fs={1}>
          <SvgImage source={infoSvg} fill={getTokens().color.red.val} />
          <Text fos={12} col="$red" ff="$body600" numberOfLines={3}>
            {t('offerForm.listingTypeNotSet')}
          </Text>
        </XStack>
      )}
      <XStack mb="$1">
        <Text
          testID="@offerInfoPreview/offerDescriptionText"
          flex={1}
          numberOfLines={reduceDescriptionLength ? 5 : undefined}
          ellipsizeMode={reduceDescriptionLength ? 'tail' : undefined}
          fos={18}
          color={negative ? '$greyOnBlack' : '$black'}
          ff="$body500"
          userSelect="text"
          selectionColor={getTokens().color.main.val}
        >
          {offer.publicPart.offerDescription}
        </Text>
      </XStack>
      {!!showCommonFriends && (
        <Stack py="$2">
          <CommonFriends
            commonConnectionsHashes={offer.privatePart.commonFriends}
            variant="light"
            otherSideClubs={clubsForOffer}
          />
        </Stack>
      )}
      <XStack gap="$1">
        {!offer.publicPart.listingType ||
        offer.publicPart.listingType === 'BITCOIN' ? (
          <BtcOfferColumns offer={offer} />
        ) : (
          <ProductAndOtherOfferColumns offer={offer} />
        )}
      </XStack>
    </Stack>
  )
}

export default OfferInfoPreview
