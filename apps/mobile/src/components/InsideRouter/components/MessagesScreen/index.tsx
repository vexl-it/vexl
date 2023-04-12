import ContainerWithTopBorderRadius from '../ContainerWithTopBorderRadius'
import {type InsideTabScreenProps} from '../../../../navigationTypes'
import {Text} from 'tamagui'

type Props = InsideTabScreenProps<'Messages'>
function MessagesScreen({navigation}: Props): JSX.Element {
  return (
    <ContainerWithTopBorderRadius scrollView={true} withTopPadding>
      <Text col="$white">MessagesScreen</Text>
    </ContainerWithTopBorderRadius>
  )
}

export default MessagesScreen
