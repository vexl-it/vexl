import {useNavigation} from '@react-navigation/native'
import {
  AnimatedNavigationBar,
  BellNotification,
  MathCalculate,
  UserProfile,
  type AnimatedNavigationBarAction,
} from '@vexl-next/ui'
import React, {useCallback, useMemo} from 'react'
import {type SharedValue} from 'react-native-reanimated'

function InsideNavigationBar({
  title,
  scrollY,
}: {
  readonly title?: string
  readonly scrollY: SharedValue<number>
}): React.JSX.Element {
  const navigation = useNavigation()

  const handleCalculatorPress = useCallback(() => {
    navigation.navigate('TradeCalculatorFlow', {screen: 'TradeCalculator'})
  }, [navigation])

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('Settings')
  }, [navigation])

  const handleNotificationCenterPress = useCallback(() => {
    navigation.navigate('NotificationCenter')
  }, [navigation])

  const rightActions: readonly AnimatedNavigationBarAction[] = useMemo(
    () => [
      {icon: BellNotification, onPress: handleNotificationCenterPress},
      {icon: MathCalculate, onPress: handleCalculatorPress},
      {icon: UserProfile, onPress: handleSettingsPress},
    ],
    [handleCalculatorPress, handleNotificationCenterPress, handleSettingsPress]
  )

  return (
    <AnimatedNavigationBar
      title={title}
      rightActions={rightActions}
      scrollY={scrollY}
    />
  )
}

export default InsideNavigationBar
