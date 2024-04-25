import {isSome} from 'fp-ts/Option'
import {useSetAtom} from 'jotai'
import {useEffect} from 'react'
import {Stack, Text, YStack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {useSingleOffer} from '../../state/marketplace'
import {focusOfferActionAtom} from '../../state/marketplace/atoms/map/focusedOffer'
import {useTranslation} from '../../utils/localization/I18nProvider'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import KeyboardAvoidingView from '../KeyboardAvoidingView'
import MarketplaceMapContainer from '../MarketplaceMapContainer'
import Screen from '../Screen'
import OfferInfo from './components/OfferInfo'

type Props = RootStackScreenProps<'OfferDetail'>

function OfferDetailScreen({
  route: {
    params: {offerId},
  },
  navigation,
}: Props): JSX.Element {
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

  const RootContainer =
    isSome(offer) && offer.value.offerInfo.publicPart.location.length > 0
      ? Stack
      : Screen

  return (
    <RootContainer f={1} bc="$black">
      <MarketplaceMapContainer />
      <KeyboardAvoidingView>
        {isSome(offer) ? (
          <OfferInfo navigation={navigation} offer={offer.value} />
        ) : (
          <YStack
            f={1}
            p="$2"
            pt="0"
            space="$5"
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
        )}
      </KeyboardAvoidingView>
    </RootContainer>
  )
}

export default OfferDetailScreen
