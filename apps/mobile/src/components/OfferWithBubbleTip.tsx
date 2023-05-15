import {Stack, Text, XStack} from 'tamagui'
import OfferInfoPreview from './OfferInfoPreview'
import SvgImage from './Image'
import bubbleTipSvg, {
  bubbleTipSvgNegative,
} from './InsideRouter/components/MarketplaceScreen/images/bubbleTipSvg'
import {AnonymousAvatarFromSeed} from './AnonymousAvatar'
import randomName from '../utils/randomName'
import {type StyleProp, type ViewStyle} from 'react-native'
import {type ReactNode, useMemo} from 'react'
import {type OneOfferInState} from '../state/marketplace/domain'
import UserNameWithSellingBuying from './UserNameWithSellingBuying'
import ContactTypeAndCommonNumber from './ContactTypeAndCommonNumber'
import UserAvatar from './UserAvatar'
import {DateTime} from 'luxon'
import {useTranslation} from '../utils/localization/I18nProvider'
import {useSessionAssumeLoggedIn} from '../state/session'

export default function OfferWithBubbleTip({
  offer: {offerInfo: offer, ownershipInfo},
  button,
  negative,
}: {
  offer: OneOfferInState
  button?: ReactNode
  negative?: boolean
}): JSX.Element {
  const {t} = useTranslation()
  const session = useSessionAssumeLoggedIn()
  const avatarStyles: StyleProp<ViewStyle> = useMemo(
    () => ({
      width: 48,
      height: 48,
    }),
    []
  )

  return (
    <Stack>
      <Stack bg={negative ? '$grey' : '$white'} p="$4" br="$5">
        <OfferInfoPreview negative={negative} offer={offer} />
        <Stack pos="absolute" b={-7} l={43}>
          <SvgImage source={negative ? bubbleTipSvgNegative : bubbleTipSvg} />
        </Stack>
      </Stack>
      <XStack ai="center" jc="space-between" mt="$2">
        {ownershipInfo ? (
          <>
            <UserAvatar
              width={48}
              height={48}
              userImage={session.realUserData.image}
            />
            <Stack f={1} ml={'$2'}>
              <Text fos={16} ff={'$body600'} col={'$white'}>
                {t('myOffers.myOffer')}
              </Text>
              <Text fos={12} ff={'$body500'} col={'$greyOnBlack'}>
                {t('myOffers.offerAdded', {
                  date: DateTime.fromISO(offer.createdAt).toLocaleString(
                    DateTime.DATE_FULL
                  ),
                })}
              </Text>
            </Stack>
          </>
        ) : (
          <>
            <AnonymousAvatarFromSeed
              grayScale={negative ?? false}
              width={48}
              height={48}
              style={avatarStyles}
              seed={offer.offerId}
            />
            <Stack f={1} ml="$2">
              <UserNameWithSellingBuying
                offerInfo={{
                  offerType: offer.publicPart.offerType,
                  offerDirection: ownershipInfo ? 'myOffer' : 'theirOffer',
                }}
                userName={randomName(offer.offerId)}
              />
              <ContactTypeAndCommonNumber
                friendLevel={offer.privatePart.friendLevel ?? []}
                numberOfCommonFriends={offer.privatePart.commonFriends.length}
              />
            </Stack>
          </>
        )}
        {button && button}
        {/* Friend of friend info */}
      </XStack>
    </Stack>
  )
}
