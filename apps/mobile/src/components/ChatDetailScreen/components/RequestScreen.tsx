import {useMolecule} from 'bunshi/dist/react'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/function'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useState} from 'react'
import {ScrollView} from 'react-native'
import {Stack, YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import randomName from '../../../utils/randomName'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import Button from '../../Button'
import InfoSquare from '../../InfoSquare'
import OfferRequestTextInput from '../../OfferRequestTextInput'
import {chatMolecule} from '../atoms'
import AcceptDeclineButtons from './AcceptDeclineButtons'
import ChatHeader from './ChatHeader'
import ChatRequestPreview from './ChatRequestPreview'
import RerequestButtonOrMessage from './RerequestButtonOrMessage'

function RequestScreen(): JSX.Element {
  const {
    offerForChatAtom,
    requestMessageAtom,
    wasDeniedAtom,
    chatAtom,
    wasCancelledAtom,
    deleteChatWithUiFeedbackAtom,
    forceShowHistoryAtom,
    requestStateAtom,
    hasPreviousCommunicationAtom,
    canBeRerequestedAtom,
    rerequestOfferActionAtom,
  } = useMolecule(chatMolecule)
  const offer = useAtomValue(offerForChatAtom)
  const chat = useAtomValue(chatAtom)
  const {t} = useTranslation()

  const requestState = useAtomValue(requestStateAtom)
  const requestMessage = useAtomValue(requestMessageAtom)
  const wasDenied = useAtomValue(wasDeniedAtom)
  const wasCancelled = useAtomValue(wasCancelledAtom)
  const deleteChat = useSetAtom(deleteChatWithUiFeedbackAtom)
  const safeGoBack = useSafeGoBack()
  const setForceShowHistory = useSetAtom(forceShowHistoryAtom)
  const hasPreviousCommunication = useAtomValue(hasPreviousCommunicationAtom)
  const canBeRerequested = useAtomValue(canBeRerequestedAtom)
  const rerequestOffer = useSetAtom(rerequestOfferActionAtom)

  const [text, setText] = useState('')

  const onRerequestPressed = useCallback(() => {
    if (!canBeRerequested || !text.trim()) return

    void pipe(
      rerequestOffer({text}),
      T.map((success) => {
        if (success) {
          setText('')
        }
      })
    )()
  }, [canBeRerequested, text, rerequestOffer])

  const onHistoryPress = useCallback(() => {
    setForceShowHistory((v) => !v)
  }, [setForceShowHistory])

  const requestIsClosed = wasDenied || wasCancelled

  const requestedByMe = requestMessage?.state === 'sent'

  return (
    <>
      <ChatHeader
        mode="photoTop"
        leftButton="back"
        rightButton={
          requestIsClosed ? 'deleteChat' : requestedByMe ? null : 'block'
        }
      />
      <ScrollView bounces={false}>
        <YStack space="$6" f={1} mx="$4" my="$6">
          {offer && (
            <ChatRequestPreview showRequestMessage mode="commonFirst" />
          )}

          <YStack space="$2">
            {hasPreviousCommunication === 'anotherInteractionWithHistory' && (
              <InfoSquare onPress={onHistoryPress}>
                {t('messages.showFullChatHistory')}
              </InfoSquare>
            )}
            {hasPreviousCommunication === 'interactionAfterDelete' && (
              <InfoSquare>{t('offer.requestStatus.deleted')}</InfoSquare>
            )}
            {hasPreviousCommunication === 'firstInteraction' &&
              requestedByMe && (
                <InfoSquare>
                  {t('messages.thisWillBeYourFirstInteraction')}
                </InfoSquare>
              )}
            {requestState === 'requested' && requestedByMe && (
              <InfoSquare>
                {t('messages.wellLetYouKnowOnceUserAccepts')}
              </InfoSquare>
            )}
            {canBeRerequested.canBeRerequested && (
              <OfferRequestTextInput text={text} onChange={setText} />
            )}
          </YStack>
        </YStack>
      </ScrollView>
      <Stack mx="$4" mb="$4">
        {requestState === 'requested' &&
          (requestedByMe ? (
            <YStack space="$2">
              <RerequestButtonOrMessage
                onRerequestPressed={onRerequestPressed}
                rerequestButtonDisabled={!text.trim()}
              />
            </YStack>
          ) : (
            <AcceptDeclineButtons />
          ))}
        {requestState === 'cancelled' && (
          <Stack space="$2">
            <InfoSquare negative>
              {t('messages.messagePreviews.incoming.CANCEL_REQUEST_MESSAGING', {
                name: randomName(chat.id),
              })}
            </InfoSquare>
            <RerequestButtonOrMessage
              onRerequestPressed={onRerequestPressed}
              rerequestButtonDisabled={!text.trim()}
            />
            <Button
              text={t('messages.deleteChat')}
              variant="primary"
              onPress={() => {
                void deleteChat().then((success) => {
                  if (success) {
                    safeGoBack()
                  }
                })
              }}
            />
          </Stack>
        )}
        {requestState === 'denied' && (
          <YStack space="$2">
            <InfoSquare negative>
              {t(
                requestedByMe ? 'messages.deniedByThem' : 'messages.deniedByMe',
                {name: randomName(chat.id)}
              )}
            </InfoSquare>
            <RerequestButtonOrMessage
              onRerequestPressed={onRerequestPressed}
              rerequestButtonDisabled={!text.trim()}
            />
          </YStack>
        )}
      </Stack>
    </>
  )
}

export default RequestScreen
