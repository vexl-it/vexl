import {Picker} from '@react-native-picker/picker'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {generateKeyPair} from '@vexl-next/resources-utils/src/utils/crypto'
import {Array, Effect} from 'effect'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {useAtomValue, useStore} from 'jotai'
import React, {useState} from 'react'
import {Alert} from 'react-native'
import {Text, YStack} from 'tamagui'
import {apiAtom} from '../../../api'
import messagingStateAtom from '../../../state/chat/atoms/messagingStateAtom'
import {createInboxAtom} from '../../../state/chat/hooks/useCreateInbox'
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

  function cloneOffer10x(offer: OneOfferInState): T.Task<null> {
    if (packageName === 'it.vexl.next') {
      Alert.alert('Not available in production')
      return T.of(null)
    }
    return pipe(
      Array.range(0, 9),
      Array.map((i) =>
        pipe(
          generateKeyPair(),
          TE.fromEither,
          TE.bindTo('key'),
          TE.bindW('createdOffer', ({key}) =>
            effectToTaskEither(
              store.set(createOfferActionAtom, {
                payloadPublic: {
                  ...offer.offerInfo.publicPart,
                  offerPublicKey: key.publicKeyPemBase64,
                  offerDescription: `#${i} ${offer.offerInfo.publicPart.offerDescription}`,
                  authorClientVersion: version,
                },
                offerKey: key,
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
              })
            )
          ),
          TE.chainFirstW(({key, createdOffer}) =>
            store.set(createInboxAtom, {
              inbox: {
                privateKey: key,
                offerId: createdOffer.offerInfo.offerId,
              },
            })
          ),
          TE.matchW(
            (l) => {
              console.error(
                `Creating offer ${
                  i + 1
                }/ 10, Error creating offer: ${JSON.stringify(l)}`
              )
            },
            () => {
              console.log(`created offer ${i + 1}/ 10`)
            }
          )
        )
      ),
      T.sequenceSeqArray,
      T.map(() => null)
    )
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
          void cloneOffer10x(selectedOffer)().then(() => {
            Alert.alert('Done')
          })
        }}
        text="Clone offer 10x"
      />
    </YStack>
  )
}

export default SimulateMissingOfferInbox
