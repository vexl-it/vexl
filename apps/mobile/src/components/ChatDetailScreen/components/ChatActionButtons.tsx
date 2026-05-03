import {useNavigation} from '@react-navigation/native'
import {Button, InfoBox, XStack, YStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {pipe} from 'effect/Function'
import {Effect} from 'effect/index'
import {useAtomValue, useSetAtom} from 'jotai'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import {chatMolecule} from '../atoms'
import AcceptDeclineButtons from './AcceptDeclineButtons'
import RerequestOrCancelButton from './RerequestOrCancelButton'

function ActionsToRender(): React.ReactElement {
  const {
    chatStateAtom,
    deleteChatWithUiFeedbackAtom,
    showOfferDeletedWithOptionToDeleteActionAtom,
    offerForChatAtom,
  } = useMolecule(chatMolecule)
  const deleteChat = useSetAtom(deleteChatWithUiFeedbackAtom)
  const {t} = useTranslation()
  const safeGoBack = useSafeGoBack()
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const showOfferDeletedWithOptionToDelete = useSetAtom(
    showOfferDeletedWithOptionToDeleteActionAtom
  )
  const offer = useAtomValue(offerForChatAtom)

  const chatState = useAtomValue(chatStateAtom)

  if (chatState === 'requestedByThem') {
    return (
      <>
        <InfoBox variant="naked">
          {t('messages.waitingForYourResponseRequest')}
        </InfoBox>
        <AcceptDeclineButtons f="unset" />
      </>
    )
  }

  if (chatState === 'requestedByMe') {
    return (
      <>
        <InfoBox variant="naked">
          {t('messages.waitingForResponseRequest')}
        </InfoBox>
        <RerequestOrCancelButton />
      </>
    )
  }

  if (chatState === 'requestDeniedByMe') {
    return (
      <Button
        size="large"
        variant="destructive"
        onPress={() => {
          void pipe(
            deleteChat({skipAsk: true, skipDonation: true, skipFeedback: true}),
            Effect.zipLeft(
              Effect.sync(() => {
                safeGoBack()
              })
            ),
            Effect.runPromise
          )
        }}
      >
        {t('messages.deleteChat')}
      </Button>
    )
  }

  if (chatState === 'requestDeniedByThem') {
    return (
      <XStack width="100%" gap="$3">
        <Button
          f={1}
          size="large"
          variant="destructive"
          onPress={() => {
            void pipe(
              deleteChat({
                skipAsk: true,
                skipDonation: true,
                skipFeedback: true,
              }),
              Effect.zipLeft(
                Effect.sync(() => {
                  safeGoBack()
                })
              ),
              Effect.runPromise
            )
          }}
        >
          {t('messages.deleteChat')}
        </Button>
        <Button
          f={1}
          size="large"
          variant="primary"
          onPress={() => {
            if (!offer) {
              showOfferDeletedWithOptionToDelete()
              return
            }

            navigation.navigate('SendMessage', {
              offerId: offer.offerInfo.offerId,
              mode: 'rerequest',
            })
          }}
        >
          {t('common.rerequest')}
        </Button>
      </XStack>
    )
  }

  if (chatState === 'chatClosed') {
    return (
      <Button
        width="100%"
        size="large"
        variant="destructive"
        onPress={() => {
          void pipe(
            deleteChat({
              skipAsk: true,
            }),
            Effect.zipLeft(
              Effect.sync(() => {
                safeGoBack()
              })
            ),
            Effect.runPromise
          )
        }}
      >
        {t('messages.deleteChat')}
      </Button>
    )
  }

  if (chatState === 'requestCancelledByThem') {
    return (
      <>
        <Button
          width="100%"
          size="large"
          variant="destructive"
          onPress={() => {
            void pipe(
              deleteChat({
                skipAsk: true,
                skipDonation: true,
                skipFeedback: true,
              }),
              Effect.zipLeft(
                Effect.sync(() => {
                  safeGoBack()
                })
              ),
              Effect.runPromise
            )
          }}
        >
          {t('messages.deleteChat')}
        </Button>
      </>
    )
  }

  return <></>
}

export function ChatActionButtons(): React.ReactElement {
  return (
    <YStack px="$5" gap="$5" pt="$6" backgroundColor="$backgroundSecondary">
      <ActionsToRender />
    </YStack>
  )
}
