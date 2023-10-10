import {type RootStackScreenProps} from '../../navigationTypes'
import Screen from '../Screen'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {useSingleOffer} from '../../state/marketplace'
import {Text, YStack} from 'tamagui'
import OfferInfo from './components/OfferInfo'
import {isSome} from 'fp-ts/Option'
import Button from '../Button'
import KeyboardAvoidingView from '../KeyboardAvoidingView'

type Props = RootStackScreenProps<'OfferDetail'>

function OfferDetailScreen({
  route: {
    params: {offerId},
  },
  navigation,
}: Props): JSX.Element {
  const safeGoBack = useSafeGoBack()
  const {t} = useTranslation()

  const offer = useSingleOffer(offerId)

  return (
    <Screen>
      <KeyboardAvoidingView>
        {isSome(offer) ? (
          <OfferInfo navigation={navigation} offer={offer.value} />
        ) : (
          <YStack
            f={1}
            p="$2"
            space="$5"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="$white" fs={20} ff={'$body600'} textAlign={'center'}>
              {t('offer.offerNotFound')}
            </Text>
            <Button
              size={'small'}
              fullWidth
              variant={'primary'}
              onPress={safeGoBack}
              text={t('common.back')}
            />
          </YStack>
        )}
      </KeyboardAvoidingView>
    </Screen>
  )
}

export default OfferDetailScreen
