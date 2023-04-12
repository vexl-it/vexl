import {type RootStackScreenProps} from '../../navigationTypes'
import Screen from '../Screen'
import {ScrollView, Text} from 'tamagui'

type Props = RootStackScreenProps<'ChatDetail'>

function ChatDetailScreen({
  navigation,
  route: {
    params: {chatId},
  },
}: Props): JSX.Element {
  return (
    <Screen>
      <ScrollView mx="$2">
        <Text>ChatId: {chatId}</Text>
      </ScrollView>
    </Screen>
  )
}

export default ChatDetailScreen
