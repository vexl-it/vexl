import {useNavigation} from '@react-navigation/native'
import {
  AnimatedNavigationBar,
  BellNotification,
  MathCalculate,
  UserProfile,
  type AnimatedNavigationBarAction,
} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {type SharedValue} from 'react-native-reanimated'
import {shouldShowAccountIdentityDotAtom} from '../../../state/session/userDataAtoms'
import {areThereNotSeenNotificationsAtom} from '../../NotificationsScreen/state'

function InsideNavigationBar({
  title,
  scrollY,
}: {
  readonly title?: string
  readonly scrollY: SharedValue<number>
}): React.JSX.Element {
  const navigation = useNavigation()
  const areThereNotSeenNotifications = useAtomValue(
    areThereNotSeenNotificationsAtom
  )
  const shouldShowAccountIdentityDot = useAtomValue(
    shouldShowAccountIdentityDotAtom
  )

  const handleCalculatorPress = useCallback(() => {
    navigation.navigate('TradeCalculatorFlow', {screen: 'TradeCalculator'})
  }, [navigation])

  const handleSettingsPress = useCallback(() => {
    navigation.navigate('Account')
  }, [navigation])

  const handleNotificationsPress = useCallback(() => {
    navigation.navigate('Notifications')
  }, [navigation])

  const rightActions: readonly AnimatedNavigationBarAction[] = useMemo(
    () => [
      {
        icon: BellNotification,
        onPress: handleNotificationsPress,
        badge: areThereNotSeenNotifications,
      },
      {icon: MathCalculate, onPress: handleCalculatorPress},
      {
        icon: UserProfile,
        onPress: handleSettingsPress,
        badge: shouldShowAccountIdentityDot,
      },
    ],
    [
      areThereNotSeenNotifications,
      shouldShowAccountIdentityDot,
      handleCalculatorPress,
      handleNotificationsPress,
      handleSettingsPress,
    ]
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
