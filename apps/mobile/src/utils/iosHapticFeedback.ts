import * as Haptics from 'expo-haptics'
import {Platform} from 'react-native'

export function iosHapticFeedback(): void {
  if (Platform.OS === 'ios') void Haptics.selectionAsync()
}
