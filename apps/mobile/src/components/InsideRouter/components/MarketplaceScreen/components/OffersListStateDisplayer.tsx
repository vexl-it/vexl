import {type MarketplaceTabScreenProps} from '../../../../../navigationTypes'
import {useNavigation} from '@react-navigation/native'
import OffersListStateDisplayerContent from './OffersListStateDisplayerContent'

type Props = MarketplaceTabScreenProps<'Buy' | 'Sell'>

function OffersListStateDisplayer({
  route: {
    params: {type},
  },
}: Props): JSX.Element {
  const navigation = useNavigation()

  return (
    <OffersListStateDisplayerContent
      type={type}
      navigateToCreateOffer={() => {
        navigation.navigate('CreateOffer')
      }}
      navigateToFilterOffers={() => {
        navigation.navigate('FilterOffers')
      }}
      navigateToMyOffers={() => {
        navigation.navigate('MyOffers')
      }}
    />
  )
}

export default OffersListStateDisplayer
