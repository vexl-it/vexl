import {type MarketplaceTabScreenProps} from '../../../../../navigationTypes'
import {useNavigation} from '@react-navigation/native'
import OffersListStateDisplayerContent from './OffersListStateDisplayerContent'
import FilterOffersScopeProvider from '../../../../FilterOffersScopeProvider'

type Props = MarketplaceTabScreenProps<'Buy' | 'Sell'>

function OffersListStateDisplayer({
  route: {
    params: {type},
  },
}: Props): JSX.Element {
  const navigation = useNavigation()

  return (
    <FilterOffersScopeProvider type={type}>
      <OffersListStateDisplayerContent
        type={type}
        navigateToCreateOffer={() => {
          navigation.navigate('CreateOffer')
        }}
        navigateToFilterOffers={() => {
          navigation.navigate('FilterOffers', {type})
        }}
        navigateToMyOffers={() => {
          navigation.navigate('MyOffers')
        }}
      />
    </FilterOffersScopeProvider>
  )
}

export default OffersListStateDisplayer
