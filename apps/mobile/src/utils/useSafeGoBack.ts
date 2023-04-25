import {useNavigation} from '@react-navigation/native'
import {useCallback} from 'react'

export default function useSafeGoBack(): () => void {
  const navigation = useNavigation()
  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('InsideTabs', {screen: 'Marketplace'})
    }
  }, [navigation])
  return goBack
}
