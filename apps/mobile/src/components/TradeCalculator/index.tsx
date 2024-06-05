import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {ScopeProvider} from 'bunshi/dist/react'
import {StyleSheet} from 'react-native'
import {
  Directions,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler'
import Animated, {FadeIn, runOnJS} from 'react-native-reanimated'
import {Stack} from 'tamagui'
import {
  RootStackScreenProps,
  type TradeCalculatorStackParamsList,
} from '../../navigationTypes'
import useSafeGoBack from '../../utils/useSafeGoBack'
import PageWithNavigationHeader from '../PageWithNavigationHeader'
import PremiumOrDiscountScreen from './components/PremiumOrDiscountScreen'
import SetYourOwnPriceScreen from './components/SetYourOwnPriceScreen'
import TradeCalculator from './components/TradeCalculator'
import { TradeCalculatorScope } from './atoms'

const styles = StyleSheet.create({
  backdrop: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
})

const StackNavigator =
  createNativeStackNavigator<TradeCalculatorStackParamsList>()

function GoBackOnSwipeDown({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const goBack = useSafeGoBack()

  return (
    <GestureDetector
      gesture={Gesture.Fling()
        .direction(Directions.DOWN)
        .onEnd(() => {
          runOnJS(goBack)()
        })}
    >
      {children}
    </GestureDetector>
  )
}

type Props = RootStackScreenProps<'TradeCalculatorFlow'>

export default function TradeCalculatorFlow({
  route: {
    params: {amountData},
  },
}: Props): JSX.Element {
  return (
    <>
      <Animated.View entering={FadeIn.delay(200)} style={styles.backdrop} />
      <Stack h={100} />
      <GoBackOnSwipeDown>
        <Stack bc="$black" pt="$2">
          <Stack width={36} h={5} als="center" bc="$greyAccent1" br="$5" />
        </Stack>
      </GoBackOnSwipeDown>
      <ScopeProvider scope={TradeCalculatorScope}>
        <PageWithNavigationHeader>
          <StackNavigator.Navigator
            screenOptions={{headerShown: false}}
            initialRouteName="TradeCalculator"
          >
            <StackNavigator.Screen
              name="TradeCalculator"
              component={TradeCalculator}
            />
            <StackNavigator.Screen
              name="SetYourOwnPrice"
              component={SetYourOwnPriceScreen}
            />
            <StackNavigator.Screen
              name="PremiumOrDiscount"
              component={PremiumOrDiscountScreen}
            />
          </StackNavigator.Navigator>
        </PageWithNavigationHeader>
      </ScopeProvider>
    </>
  )
}
