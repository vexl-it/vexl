import styled from '@emotion/native'
import Text from './Text'
import Button from './Button'
import {useNavigation} from '@react-navigation/native'

const RootContainer = styled.SafeAreaView`
  flex: 1;
`

function TodoScreen(): JSX.Element {
  const navigation = useNavigation()
  return (
    <RootContainer>
      <Text>To be done</Text>
      <Button
        variant="secondary"
        text="Go back"
        onPress={() => {
          navigation.goBack()
        }}
      ></Button>
    </RootContainer>
  )
}

export function useGoToTodo(): () => void {
  const navigation = useNavigation()
  return () => {
    navigation.navigate('TodoScreen')
  }
}

export default TodoScreen
