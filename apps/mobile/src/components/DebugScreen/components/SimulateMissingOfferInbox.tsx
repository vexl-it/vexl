import {Picker} from '@react-native-picker/picker'
import {
  newOfferId,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {effectToTaskEither} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {Button, Typography, YStack} from '@vexl-next/ui'
import {Array, Effect} from 'effect'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {useAtomValue, useStore} from 'jotai'
import React, {useState} from 'react'
import {Alert} from 'react-native'
import {apiAtom} from '../../../api'
import messagingStateAtom from '../../../state/chat/atoms/messagingStateAtom'
import {upsertInboxOnBeAndLocallyActionAtom} from '../../../state/chat/hooks/useCreateInbox'
import {createOfferActionAtom} from '../../../state/marketplace/atoms/createOfferActionAtom'
import {myOffersAtom} from '../../../state/marketplace/atoms/myOffers'
import {packageName, version} from '../../../utils/environment'

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
          store.set(upsertInboxOnBeAndLocallyActionAtom, {
            for: 'myOffer',
            offerId: newOfferId(),
          }),
          effectToTaskEither,
          TE.bindTo('inbox'),
          TE.bindW('createdOffer', ({inbox}) =>
            effectToTaskEither(
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
              })
            )
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
      <Typography variant="titlesSmall" color="$foregroundPrimary">
        Simulate missing offer inbox
      </Typography>
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
      >
        Delete on server
      </Button>
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
      >
        Delete everywhere
      </Button>
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
      >
        Clone offer 10x
      </Button>
    </YStack>
  )
}

export default SimulateMissingOfferInbox
