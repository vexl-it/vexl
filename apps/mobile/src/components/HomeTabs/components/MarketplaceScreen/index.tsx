import ContainerWithTopBorderRadius, {
  CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING,
} from '../ContainerWithTopBorderRadius'
import {type MarketplaceTabParamsList} from '../../../../navigationTypes'
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs'
import OffersListWithFilter from './components/OffersListStateDisplayer'
import {css} from '@emotion/native'
import {useTheme} from '@emotion/react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'

const Tab = createMaterialTopTabNavigator<MarketplaceTabParamsList>()

function MarketplaceScreen(): JSX.Element {
  const theme = useTheme()
  const {t} = useTranslation()

  return (
    <ContainerWithTopBorderRadius>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: css`
            margin-top: ${String(
              CONTAINER_WITH_TOP_BORDER_RADIUS_TOP_PADDING
            )}px;

            background-color: ${theme.colors.black};
            border-bottom-color: ${theme.colors.grey};
            border-bottom-width: 2px;
          `,
          tabBarContentContainerStyle: css`
            margin: 0;
            padding: 0;
          `,
          tabBarLabelStyle: css`
            font-size: 40px;
            line-height: 42px; // if we
            font-family: '${theme.fonts.ppMonument}';
            text-transform: none;
            margin: 0;
          `,
          tabBarActiveTintColor: theme.colors.main,
          tabBarInactiveTintColor: theme.colors.grayOnBlack,
          tabBarIndicatorStyle: css`
            //background-color:,
            height: 2px;
            bottom: -2px;
          `,
        }}
      >
        <Tab.Screen
          name="Sell"
          initialParams={{type: 'sell'}}
          component={OffersListWithFilter}
        />
        <Tab.Screen
          name="Buy"
          options={{tabBarLabel: t('offer.buy')}}
          initialParams={{type: 'buy'}}
          component={OffersListWithFilter}
        />
      </Tab.Navigator>
    </ContainerWithTopBorderRadius>
  )
}

export default MarketplaceScreen
