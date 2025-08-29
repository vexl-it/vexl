import {isSome} from 'fp-ts/Option'
import {useSetAtom} from 'jotai'
import React, {useEffect} from 'react'
import {KeyboardAwareScrollView} from 'react-native-keyboard-controller'
import {Stack, Text, YStack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useSingleOffer} from '../../state/marketplace'
import {focusOfferActionAtom} from '../../state/marketplace/atoms/map/focusedOffer'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import MarketplaceMapContainer from '../MarketplaceMapContainer'
import Screen from '../Screen'
import OfferInfo from './components/OfferInfo'
import Title from './components/Title'

type Props = RootStackScreenProps<'OfferDetail'>

const SCROLL_EXTRA_OFFSET = 200

function OfferDetailScreen({
  route: {
    params: {offerId},
  },
  navigation,
}: Props): React.ReactElement {
  const safeGoBack = useSafeGoBack()
  const setFocusedOffer = useSetAtom(focusOfferActionAtom)
  const {t} = useTranslation()

  const offer = useSingleOffer(offerId)

  useEffect(() => {
    setFocusedOffer(offerId)
    return () => {
      setFocusedOffer(null)
    }
  }, [offerId, setFocusedOffer])

  if (!isSome(offer))
    return (
      <YStack
        f={1}
        p="$2"
        pt="0"
        gap="$5"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="$white" fs={20} ff="$body600" textAlign="center">
          {t('offer.offerNotFound')}
        </Text>
        <Button
          size="small"
          fullWidth
          variant="primary"
          onPress={safeGoBack}
          text={t('common.back')}
        />
      </YStack>
    )

  const RootContainer =
    offer.value.offerInfo.publicPart.location.length > 0 ? Stack : Screen

  return (
    <RootContainer f={1} bc="$black">
      <Stack f={1}>
        {offer.value.offerInfo.publicPart.locationState.includes(
          'IN_PERSON'
        ) ? (
          <KeyboardAwareScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            bottomOffset={SCROLL_EXTRA_OFFSET}
          >
            <MarketplaceMapContainer />
            <Title offer={offer.value} />
            <OfferInfo
              mapIsVisible
              navigation={navigation}
              offer={offer.value}
            />
          </KeyboardAwareScrollView>
        ) : (
          <OfferInfo navigation={navigation} offer={offer.value} />
        )}
      </Stack>
    </RootContainer>
  )
}

export default OfferDetailScreen
