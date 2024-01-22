import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {type MarketplaceTabScreenProps} from '../../../../../navigationTypes'
import visibleMarketplaceSectionAtom from '../../../../../state/marketplace/atoms/visibleMarketplaceSectionAtom'
import OffersListStateDisplayerContent from './OffersListStateDisplayerContent'

type Props = MarketplaceTabScreenProps<'Buy' | 'Sell'>

function OffersListStateDisplayer({
  route: {
    params: {type},
  },
}: Props): JSX.Element {
  const navigation = useNavigation()
  const setVisibleMarketplaceSection = useSetAtom(visibleMarketplaceSectionAtom)

  useFocusEffect(
    useCallback(() => {
      setVisibleMarketplaceSection(type)
    }, [type, setVisibleMarketplaceSection])
  )

  return (
    <OffersListStateDisplayerContent
      type={type}
      navigateToCreateOffer={() => {
        navigation.navigate('CreateOffer')
      }}
      navigateToMyOffers={() => {
        navigation.navigate('MyOffers')
      }}
    />
  )
}

export default OffersListStateDisplayer
