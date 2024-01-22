import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs'
import {OfferType} from '@vexl-next/domain/src/general/offers'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {getTokens} from 'tamagui'
import {type MarketplaceTabParamsList} from '../../../../navigationTypes'
import {triggerOffersRefreshAtom} from '../../../../state/marketplace'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {useAppState} from '../../../../utils/useAppState'
import ContainerWithTopBorderRadius, {
  CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING,
} from '../ContainerWithTopBorderRadius'
import CustomTabBar from './components/CustomTabBar'
import OffersListWithFilter from './components/OffersListStateDisplayer'

const Tab = createMaterialTopTabNavigator<MarketplaceTabParamsList>()

const screenOptions = {
  tabBarStyle: {
    marginTop: CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING,
    backgroundColor: getTokens().color.black.val,
    borderBottomColor: getTokens().color.grey.val,
    borderBottomWidth: 2,
  },
  tabBarContentContainerStyle: {
    margin: 0,
    padding: 0,
  },
  tabBarActiveTintColor: getTokens().color.main.val,
  tabBarInactiveTintColor: getTokens().color.greyOnBlack.val,
  tabBarIndicatorStyle: {
    height: 2,
    bottom: -2,
  },
}

function MarketplaceScreen(): JSX.Element {
  const {t} = useTranslation()
  const refreshOffers = useSetAtom(triggerOffersRefreshAtom)

  useAppState(
    useCallback(
      (state) => {
        if (state === 'active') {
          void refreshOffers()
        }
      },
      [refreshOffers]
    )
  )

  return (
    <ContainerWithTopBorderRadius>
      <Tab.Navigator tabBar={CustomTabBar} screenOptions={screenOptions}>
        <Tab.Screen
          name="Sell"
          options={{
            tabBarLabel: t('offer.sell'),
          }}
          initialParams={{type: OfferType.parse('SELL')}}
          component={OffersListWithFilter}
        />
        <Tab.Screen
          name="Buy"
          options={{tabBarLabel: t('offer.buy')}}
          initialParams={{type: OfferType.parse('BUY')}}
          component={OffersListWithFilter}
        />
      </Tab.Navigator>
    </ContainerWithTopBorderRadius>
  )
}

export default MarketplaceScreen
