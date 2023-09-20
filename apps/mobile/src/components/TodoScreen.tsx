import Button from './Button'
import {useNavigation} from '@react-navigation/native'
import {Stack, Text} from 'tamagui'
import useSafeGoBack from '../utils/useSafeGoBack'

function TodoScreen(): JSX.Element {
  const safeGoBack = useSafeGoBack()
  return (
    <Stack f={1}>
      <Text col="$black">To be done</Text>
      <Button variant="secondary" text="Go back" onPress={safeGoBack}></Button>
    </Stack>
  )
}

export function useGoToTodo(): () => void {
  const navigation = useNavigation()
  return () => {
    navigation.navigate('TodoScreen')
  }
}

export default TodoScreen
