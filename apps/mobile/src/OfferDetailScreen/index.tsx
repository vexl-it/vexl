import {type RootStackScreenProps} from '../navigationTypes'
import {useSingleOffer} from '../state/offers'
import Text from '../components/Text'
import {ScrollView} from 'react-native'
import Button from '../components/Button'
import styled from '@emotion/native'

const RootContainer = styled.SafeAreaView`
  background-color: black;
  align-items: stretch;
  justify-content: center;
  flex: 1;
`

type Props = RootStackScreenProps<'OfferDetail'>
function OfferDetailScreen({
  route: {
    params: {offerId},
  },
  navigation,
}: Props): JSX.Element {
  const offer = useSingleOffer(offerId)

  return (
    <RootContainer>
      <ScrollView>
        <Text colorStyle="white">{JSON.stringify(offer, null, 2)}</Text>
      </ScrollView>
      <Button onPress={navigation.goBack} text="back" variant="secondary" />
    </RootContainer>
  )
}

export default OfferDetailScreen
