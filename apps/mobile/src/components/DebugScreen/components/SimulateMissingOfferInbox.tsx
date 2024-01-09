import {Picker} from '@react-native-picker/picker'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {useAtomValue, useStore} from 'jotai'
import {useState} from 'react'
import {Alert} from 'react-native'
import {Text, YStack} from 'tamagui'
import {usePrivateApiAssumeLoggedIn} from '../../../api'
import messagingStateAtom from '../../../state/chat/atoms/messagingStateAtom'
import Button from '../../Button'
import {myOffersAtom} from '../../../state/marketplace/atoms/myOffers'

function SimulateMissingOfferInbox(): JSX.Element {
  const offers = useAtomValue(myOffersAtom)
  const [selectedOffer, setSelectedOffer] = useState<OneOfferInState | null>(
    offers[0] ?? null
  )
  const api = usePrivateApiAssumeLoggedIn()
  const store = useStore()

  async function deleteInboxOnServer(offer: OneOfferInState): Promise<void> {
    const inbox = store
      .get(messagingStateAtom)
      .find((one) => one.inbox.offerId === selectedOffer?.offerInfo.offerId)
    if (!inbox) {
      Alert.alert('No inbox for that offer found in state')
      return
    }
    await api.chat.deleteInbox({keyPair: inbox.inbox.privateKey})()
  }

  function removeInboxFromState(forOffer: OneOfferInState): void {
    store.set(messagingStateAtom, (state) =>
      state.filter((one) => one.inbox.offerId !== forOffer.offerInfo.offerId)
    )
  }

  return (
    <YStack space="$2">
      <Text color="$black" fos={25}>
        Simulate missing offer inbox
      </Text>
      <Picker selectedValue={selectedOffer} onValueChange={setSelectedOffer}>
        {offers.map((one) => (
          <Picker.Item
            key={one.offerInfo.id}
            label={one.offerInfo.publicPart.offerDescription}
            value={one}
          />
        ))}
      </Picker>
      <Button
        size="small"
        variant="primary"
        disabled={!selectedOffer}
        onPress={() => {
          if (!selectedOffer) return
          void deleteInboxOnServer(selectedOffer).then(() => {
            Alert.alert('Done')
          })
        }}
        text="Delete on server"
      />
      <Button
        size="small"
        variant="primary"
        disabled={!selectedOffer}
        onPress={() => {
          if (!selectedOffer) return
          void deleteInboxOnServer(selectedOffer).then(() => {
            removeInboxFromState(selectedOffer)
            Alert.alert('Done')
          })
        }}
        text="Delete everywhere"
      />
    </YStack>
  )
}

export default SimulateMissingOfferInbox
