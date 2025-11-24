import {Picker} from '@react-native-picker/picker'
import {
  newOfferId,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {Array, Effect, Either} from 'effect'
import {useAtomValue, useStore} from 'jotai'
import React, {useState} from 'react'
import {Alert} from 'react-native'
import {Text, YStack} from 'tamagui'
import {apiAtom} from '../../../api'
import messagingStateAtom from '../../../state/chat/atoms/messagingStateAtom'
import {upsertInboxOnBeAndLocallyActionAtom} from '../../../state/chat/hooks/useCreateInbox'
import {createOfferActionAtom} from '../../../state/marketplace/atoms/createOfferActionAtom'
import {myOffersAtom} from '../../../state/marketplace/atoms/myOffers'
import {packageName, version} from '../../../utils/environment'
import Button from '../../Button'

function SimulateMissingOfferInbox(): React.ReactElement {
  const offers = useAtomValue(myOffersAtom)
  const [selectedOffer, setSelectedOffer] = useState<OneOfferInState | null>(
    offers[0] ?? null
  )
  const store = useStore()

  async function deleteInboxOnServer(offer: OneOfferInState): Promise<void> {
    const inbox = store
      .get(messagingStateAtom)
      .find((one) => one.inbox.offerId === selectedOffer?.offerInfo.offerId)
    if (!inbox) {
      Alert.alert('No inbox for that offer found in state')
      return
    }
    await Effect.runPromise(
      store.get(apiAtom).chat.deleteInbox({keyPair: inbox.inbox.privateKey})
    )
  }

  function cloneOffer10x(
    offer: OneOfferInState
  ): Effect.Effect<null, never, never> {
    if (packageName === 'it.vexl.next') {
      Alert.alert('Not available in production')
      return Effect.succeed(null)
    }
    return Effect.gen(function* (_) {
      yield* _(
        Array.map(Array.range(0, 9), (i) =>
          Effect.gen(function* (_) {
            const result = yield* _(
              Effect.all(
                [
                  store.set(upsertInboxOnBeAndLocallyActionAtom, {
                    for: 'myOffer',
                    offerId: newOfferId(),
                  }),
                ] as const,
                {concurrency: 1}
              ),
              Effect.either
            )

            if (Either.isLeft(result)) {
              console.error(
                `Creating offer ${
                  i + 1
                }/ 10, Error creating inbox: ${JSON.stringify(result.left)}`
              )
              return
            }

            const inbox = result.right[0]
            const createResult = yield* _(
              store.set(createOfferActionAtom, {
                offerId: newOfferId(),
                payloadPublic: {
                  ...offer.offerInfo.publicPart,
                  offerPublicKey: inbox.inbox.privateKey.publicKeyPemBase64,
                  offerDescription: `#${i} ${offer.offerInfo.publicPart.offerDescription}`,
                  authorClientVersion: version,
                },
                offerKey: inbox.inbox.privateKey,
                intendedClubs: [],
                intendedConnectionLevel:
                  offer.ownershipInfo?.intendedConnectionLevel ?? 'FIRST',
                onProgress: (progress) => {
                  console.log(
                    `Creating offer ${i + 1}/ 10, progress: ${JSON.stringify(
                      progress
                    )}`
                  )
                },
              }),
              Effect.either
            )

            if (Either.isLeft(createResult)) {
              console.error(
                `Creating offer ${
                  i + 1
                }/ 10, Error creating offer: ${JSON.stringify(
                  createResult.left
                )}`
              )
            } else {
              console.log(`created offer ${i + 1}/ 10`)
            }
          })
        ),
        Effect.allWith({concurrency: 1})
      )

      return null
    })
  }

  function removeInboxFromState(forOffer: OneOfferInState): void {
    store.set(messagingStateAtom, (state) =>
      state.filter((one) => one.inbox.offerId !== forOffer.offerInfo.offerId)
    )
  }

  return (
    <YStack gap="$2">
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
      <Button
        size="small"
        variant="primary"
        disabled={!selectedOffer}
        onPress={() => {
          if (!selectedOffer) return
          void Effect.runPromise(cloneOffer10x(selectedOffer)).then(() => {
            Alert.alert('Done')
          })
        }}
        text="Clone offer 10x"
      />
    </YStack>
  )
}

export default SimulateMissingOfferInbox
