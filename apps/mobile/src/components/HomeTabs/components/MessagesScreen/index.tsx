import Text from '../../../Text'
import ContainerWithTopBorderRadius from '../ContainerWithTopBorderRadius'
import {type HomeTabsTabScreenProps} from '../../../../navigationTypes'

type Props = HomeTabsTabScreenProps<'Messages'>
function MessagesScreen({navigation}: Props): JSX.Element {
  return (
    <ContainerWithTopBorderRadius scrollView={true} withTopPadding>
      <Text colorStyle="white">MessagesScreen</Text>
    </ContainerWithTopBorderRadius>
  )
}

export default MessagesScreen
