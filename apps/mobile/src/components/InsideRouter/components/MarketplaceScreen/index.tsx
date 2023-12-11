import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs'
import {OfferType} from '@vexl-next/domain/dist/general/offers'
import {useSetAtom} from 'jotai'
import {useCallback, useMemo} from 'react'
import {getTokens} from 'tamagui'
import {type MarketplaceTabParamsList} from '../../../../navigationTypes'
import {triggerOffersRefreshAtom} from '../../../../state/marketplace'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {useAppState} from '../../../../utils/useAppState'
import ContainerWithTopBorderRadius, {
  CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING,
} from '../ContainerWithTopBorderRadius'
import OffersListWithFilter from './components/OffersListStateDisplayer'
import CustomTabBar from './components/CustomTabBar'

const Tab = createMaterialTopTabNavigator<MarketplaceTabParamsList>()

function MarketplaceScreen(): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()

  const {
    tabBarStyle,
    tabBarContentContainerStyle,
    // tabBarLabelStyle,
    tabBarIndicatorStyle,
  } = useMemo(() => {
    return {
      tabBarStyle: {
        marginTop: CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING,
        backgroundColor: tokens.color.black.val,
        borderBottomColor: tokens.color.grey.val,
        borderBottomWidth: 2,
      },
      tabBarContentContainerStyle: {
        margin: 0,
        padding: 0,
      },
      tabBarIndicatorStyle: {
        height: 2,
        bottom: -2,
      },
    } as const
  }, [tokens.color.black.val, tokens.color.grey.val])

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
      <Tab.Navigator
        tabBar={CustomTabBar}
        screenOptions={{
          tabBarStyle,
          tabBarContentContainerStyle,
          tabBarActiveTintColor: tokens.color.main.val,
          tabBarInactiveTintColor: tokens.color.greyOnBlack.val,
          tabBarIndicatorStyle,
        }}
      >
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
