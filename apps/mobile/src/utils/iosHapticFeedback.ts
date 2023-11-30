import {Platform} from 'react-native'
import * as Haptics from 'expo-haptics'

export function iosHapticFeedback(): void {
  if (Platform.OS === 'ios') void Haptics.selectionAsync()
}
