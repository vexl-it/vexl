import {type RootStackScreenProps} from '../../navigationTypes'
import {ScrollView} from 'react-native'
import Button from '../Button'
import {useRequestOffer, useSingleOffer} from '../../state/marketplace'
import * as O from 'fp-ts/Option'
import {Stack, Text} from 'tamagui'
import Screen from '../Screen'
import {useChatForOffer} from '../../state/chat/hooks/useChatForOffer'

type Props = RootStackScreenProps<'OfferDetail'>

function OfferDetailScreen({
  route: {
    params: {offerId},
  },
  navigation,
}: Props): JSX.Element {
  const offer = useSingleOffer(offerId)
  const requestOffer = useRequestOffer()

  if (O.isNone(offer)) return <Text col="$white">Offer does not exist</Text> // TODO 404 page
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const chatForOffer = useChatForOffer({
    offerPublicKey: offer.value.offerInfo.publicPart.offerPublicKey,
  })

  return (
    <Screen>
      <ScrollView>
        <Text fos={32} ff="$heading" col="$white">
          {JSON.stringify(offer, null, 2)}
        </Text>
      </ScrollView>
      <Button
        disabled={false}
        onPress={() => {
          if (chatForOffer) {
            navigation.navigate('ChatDetail', {chatId: chatForOffer.id})
            return
          }
          void requestOffer({
            offer: offer.value.offerInfo,
            text: 'Test sending request',
          })()
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
        text={chatForOffer ? 'Go to chat' : 'request'}
        variant="secondary"
      />
      <Stack h={16} />
      <Button onPress={navigation.goBack} text="back" variant="primary" />
    </Screen>
  )
}

export default OfferDetailScreen
