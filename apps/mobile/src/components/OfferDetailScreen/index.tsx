import {type RootStackScreenProps} from '../../navigationTypes'
import Text from '../Text'
import {Alert, ScrollView} from 'react-native'
import Button from '../Button'
import styled from '@emotion/native'
import Spacer from '../Spacer'
import {useGetSingleOffer} from '../../state/marketplace'
import * as O from 'fp-ts/Option'

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
  const offer = useGetSingleOffer(offerId)

  if (O.isNone(offer))
    return <Text colorStyle="white">Offer does not exist</Text> // TODO 404 page

  return (
    <RootContainer>
      <ScrollView>
        <Text fontSize="heading2" colorStyle="white">
          {JSON.stringify(offer, null, 2)}
        </Text>
      </ScrollView>
      <Button
        onPress={() => {
          Alert.alert('TODO')
          // loadingOverlay.show()
          // void pipe(
          //   TE.right(userSession.privateKey),
          //   TE.chainW((privateKey) => createInbox(privateKey, offer.offerId)),
          //   TE.chainW((inbox) =>
          //     createChatAndSendRequest({
          //       toPublicKey: PublicKey.import({
          //         key: offer?.offerPublicKey,
          //         type: KeyFormat.PEM_BASE64,
          //       }),
          //       chatOrigin: ChatOrigin.parse({
          //         type: 'theirOffer',
          //         offerPublicKey: offer?.offerPublicKey,
          //       }),
          //       inbox,
          //       text: 'Hello, this should be filled by the user',
          //     })
          //   ),
          //   TE.match(
          //     (e) => {
          //       console.log(e)
          //       loadingOverlay.hide()
          //       Alert.alert('There was an error')
          //     },
          //     (chat) => {
          //       loadingOverlay.hide()
          //       navigation.navigate('ChatDetail', {chatId: chat.id})
          //     }
          //   )
          // )()
        }}
        text="sendRequest"
        variant="secondary"
      />
      <Spacer y$={4} />
      <Button onPress={navigation.goBack} text="back" variant="primary" />
    </RootContainer>
  )
}

export default OfferDetailScreen
