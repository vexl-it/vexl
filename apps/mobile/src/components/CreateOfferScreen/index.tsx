import Text from '../Text'
import {type RootStackScreenProps} from '../../navigationTypes'

type Props = RootStackScreenProps<'CreateOffer'>

function CreateOfferScreen({
  route: {
    params: {type},
  },
}: Props): JSX.Element {
  return <Text>Create Offer: {type}</Text>
}

export default CreateOfferScreen
