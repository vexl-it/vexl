import {type RootStackScreenProps} from '../../navigationTypes'
import Text from '../Text'
import styled from '@emotion/native/dist/emotion-native.cjs'

const RootContainer = styled.SafeAreaView`
  background-color: black;
  flex: 1;
`

const View = styled.ScrollView`
  margin-left: 8px;
  margin-right: 8px;
`

type Props = RootStackScreenProps<'ChatDetail'>

function ChatDetailScreen({
  navigation,
  route: {
    params: {chatId},
  },
}: Props): JSX.Element {
  return (
    <RootContainer>
      <View>
        <Text>ChatId: {chatId}</Text>
      </View>
    </RootContainer>
  )
}

export default ChatDetailScreen
