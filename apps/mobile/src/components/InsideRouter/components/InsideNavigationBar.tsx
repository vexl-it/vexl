import {useFocusEffect, useNavigation} from '@react-navigation/native'
import {
  BellNotification,
  MathCalculate,
  NavigationBar,
  UserProfile,
  useScreenScroll,
  type NavigationBarAction,
} from '@vexl-next/ui'
import React, {useCallback, useMemo} from 'react'

const noop = (): void => {}

function InsideNavigationBar(): React.JSX.Element {
  const navigation = useNavigation()
  const {scrolled, resetScroll} = useScreenScroll()

  useFocusEffect(
    useCallback(() => {
      resetScroll()
    }, [resetScroll])
  )

  const handleCalculatorPress = useCallback(() => {
    navigation.navigate('TradeCalculatorFlow', {screen: 'TradeCalculator'})
  }, [navigation])

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('Settings')
  }, [navigation])

  const rightActions: readonly NavigationBarAction[] = useMemo(
    () => [
      {icon: BellNotification, onPress: noop},
      {icon: MathCalculate, onPress: handleCalculatorPress},
      {icon: UserProfile, onPress: handleSettingsPress},
    ],
    [handleCalculatorPress, handleSettingsPress]
  )

  return (
    <NavigationBar
      style="main"
      scrolled={scrolled}
      rightActions={rightActions}
    />
  )
}

export default InsideNavigationBar
