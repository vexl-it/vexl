import {useNavigation} from '@react-navigation/native'
import {useCallback} from 'react'

export default function useResetNavigationToMessagingScreen(): () => void {
  const navigation = useNavigation()

  return useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'InsideTabs',
          state: {
            routes: [{name: 'Messages'}],
          },
        },
      ],
    })
  }, [navigation])
}
