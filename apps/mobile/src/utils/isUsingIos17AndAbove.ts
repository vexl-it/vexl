import {Platform} from 'react-native'

export function isUsingIos17AndAbove(): boolean {
  return Platform.OS === 'ios' && Number(Platform.Version) >= 17
}
