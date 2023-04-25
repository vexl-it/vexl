import SvgImage from '../../../../Image'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import {AnonymousAvatarFromSeed} from '../../../../AnonymousAvatar'
import randomName from '../../../../../utils/randomName'
import {useNavigation} from '@react-navigation/native'
import bubbleTipSvg from '../images/bubbleTipSvg'
import {type OneOfferInState} from '../../../../../state/marketplace/domain'
import {Stack, Text, XStack} from 'tamagui'
import {type StyleProp, type ViewStyle} from 'react-native'
import {useMemo} from 'react'
import OfferInfoPreview from '../../../../OfferInfoPreview'

interface Props {
  readonly offer: OneOfferInState
}

function OfferListItem({offer: {offerInfo: offer}}: Props): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const avatarStyles: StyleProp<ViewStyle> = useMemo(
    () => ({
      width: 48,
      height: 48,
    }),
    []
  )
  return (
    <Stack mt="$6">
      <Stack bg="$white" p="$4" br="$5">
        <OfferInfoPreview offer={offer} />
        <Stack pos="absolute" b={-7} l={43}>
          <SvgImage source={bubbleTipSvg} />
        </Stack>
      </Stack>
      <XStack ai="center" jc="space-between" mt="$2">
        <AnonymousAvatarFromSeed style={avatarStyles} seed={offer.offerId} />
        <Stack f={1} ml="$2">
          <Text col="$white">
            {randomName(offer.offerId)}{' '}
            <Text col="$pink">
              {offer.publicPart.offerType === 'SELL'
                ? t('offer.isSelling')
                : t('offer.isBuying')}
              <Text fos={14} col="$greyOnBlack">
                {offer.privatePart.friendLevel.includes('FIRST_DEGREE')
                  ? t('offer.directFriend')
                  : t('offer.friendOfFriend')}
              </Text>
            </Text>
          </Text>
        </Stack>
        <Button
          small
          fontSize={14}
          text={t('common.request')}
          variant="secondary"
          onPress={() => {
            navigation.navigate('OfferDetail', {offerId: offer.offerId})
          }}
        />
        {/* Friend of friend info */}
      </XStack>
    </Stack>
  )
}

export default OfferListItem
