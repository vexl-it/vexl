import {type RootStackScreenProps} from '../../navigationTypes'
import Screen from '../Screen'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {useSingleOffer} from '../../state/marketplace'
import {Text, YStack} from 'tamagui'
import OfferInfo from './components/OfferInfo'
import {isSome} from 'fp-ts/Option'
import Button from '../Button'

type Props = RootStackScreenProps<'OfferDetail'>

function OfferDetailScreen({
  route: {
    params: {offerId},
  },
}: Props): JSX.Element {
  const safeGoBack = useSafeGoBack()
  const {t} = useTranslation()

  const offer = useSingleOffer(offerId)

  return (
    <Screen>
      {isSome(offer) ? (
        <OfferInfo offer={offer.value} />
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
          ></Button>
        </YStack>
      )}
    </Screen>
  )
}

export default OfferDetailScreen
