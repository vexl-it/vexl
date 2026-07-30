import {type NavigationProp} from '@react-navigation/native'
import {type RootStackParamsList} from '../navigationTypes'

export default function navigateToBoard(
  navigation: NavigationProp<RootStackParamsList>,
  initialFilter: 'all' | 'mine'
): void {
  navigation.navigate('InsideTabs', {
    screen: 'Community',
    params: {
      screen: 'Board',
      params: {
        initialFilter,
        filterSwitchRequestId: String(Date.now()),
      },
    },
  })
}
