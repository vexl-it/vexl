import Button from './Button'
import {useNavigation} from '@react-navigation/native'
import {Stack, Text} from 'tamagui'

function TodoScreen(): JSX.Element {
  const navigation = useNavigation()
  return (
    <Stack f={1}>
      <Text>To be done</Text>
      <Button
        variant="secondary"
        text="Go back"
        onPress={() => {
          navigation.goBack()
        }}
      ></Button>
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
