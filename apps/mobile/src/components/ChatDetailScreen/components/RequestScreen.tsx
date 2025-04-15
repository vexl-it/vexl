import {useMolecule} from 'bunshi/dist/react'
import {Array} from 'effect'
import * as T from 'fp-ts/Task'
import {pipe} from 'fp-ts/function'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view'
import {Stack, YStack, getTokens} from 'tamagui'
import {clubsWithMembersAtom} from '../../../state/clubs/atom/clubsWithMembersAtom'
import getRerequestPossibleInDaysText from '../../../utils/getRerequestPossibleInDaysText'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import randomName from '../../../utils/randomName'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import Button from '../../Button'
import InfoSquare from '../../InfoSquare'
import OfferRequestTextInput from '../../OfferRequestTextInput'
import {toastNotificationAtom} from '../../ToastNotification/atom'
import {chatMolecule} from '../atoms'
import infoSvg from '../images/infoSvg'
import AcceptDeclineButtons from './AcceptDeclineButtons'
import ChatHeader from './ChatHeader'
import ChatRequestPreview from './ChatRequestPreview'
import RerequestOrCancelButton from './RerequestOrCancelButton'

const SCROLL_EXTRA_OFFSET = 250

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
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const clubsWithMembers = useAtomValue(clubsWithMembersAtom)

  const [text, setText] = useState('')

  const rerequestText = !canBeRerequested.canBeRerequested
    ? getRerequestPossibleInDaysText(canBeRerequested.possibleInDays, t)
    : null

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

  const previousCommunicationInfoMessage = useMemo(() => {
    if (hasPreviousCommunication === 'interactionAfterDelete') {
      return t('offer.requestStatus.deleted')
    }

    if (hasPreviousCommunication === 'firstInteraction' && !requestIsClosed) {
      return t('messages.thisWillBeYourFirstInteraction')
    }

    if (hasPreviousCommunication === 'anotherInteractionWithHistory') {
      return t('messages.youHaveAlreadyInteractedWithThisUser')
    }

    return undefined
  }, [hasPreviousCommunication, requestIsClosed, t])

  const previousCommunicationInfoMessageIncludingClubs = useMemo(() => {
    if (!offer || (offer && offer.offerInfo.privatePart.clubIds.length === 0))
      return previousCommunicationInfoMessage

    const clubsNames = pipe(
      clubsWithMembers,
      Array.filter((club) =>
        Array.contains(club.club.uuid)(offer.offerInfo.privatePart.clubIds)
      ),
      Array.map((club) => club.club.name)
    )

    return `${previousCommunicationInfoMessage} ${t(
      'messages.thisUserIsAlsoMemberOff',
      {
        clubs: `${clubsNames.join(`, `)}`,
      }
    )}`
  }, [clubsWithMembers, offer, previousCommunicationInfoMessage, t])

  useEffect(() => {
    if (previousCommunicationInfoMessageIncludingClubs) {
      setToastNotification({
        visible: true,
        text: previousCommunicationInfoMessageIncludingClubs,
        icon: infoSvg,
        iconFill: getTokens().color.black.val,
        showCloseButton: true,
        hideAfterMillis: 3000,
      })
    }

    return () => {
      setToastNotification((prev) => ({...prev, visible: false}))
    }
  }, [
    previousCommunicationInfoMessageIncludingClubs,
    requestState,
    setToastNotification,
    t,
  ])

  return (
    <>
      <ChatHeader
        mode="photoTop"
        leftButton="back"
        rightButton={
          requestIsClosed ? 'deleteChat' : requestedByMe ? null : 'block'
        }
      />
      <KeyboardAwareScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        extraHeight={SCROLL_EXTRA_OFFSET}
      >
        <YStack gap="$6" f={1} mx="$4" my="$6">
          {!!offer && (
            <ChatRequestPreview showRequestMessage mode="commonFirst" />
          )}

          <YStack gap="$2">
            {hasPreviousCommunication === 'anotherInteractionWithHistory' && (
              <InfoSquare onPress={onHistoryPress}>
                {t('messages.showFullChatHistory')}
              </InfoSquare>
            )}
            {requestState === 'requested' && !!requestedByMe && (
              <InfoSquare>
                {t('messages.wellLetYouKnowOnceUserAccepts')}
              </InfoSquare>
            )}
            {!!canBeRerequested.canBeRerequested && (
              <OfferRequestTextInput text={text} onChange={setText} />
            )}
            {!!rerequestText && <InfoSquare>{rerequestText}</InfoSquare>}
            {requestState === 'denied' && (
              <InfoSquare negative>
                {t(
                  requestedByMe
                    ? 'messages.deniedByThem'
                    : 'messages.deniedByMe',
                  {name: randomName(chat.id)}
                )}
              </InfoSquare>
            )}
            {requestState === 'cancelled' && (
              <InfoSquare negative>
                {t(
                  'messages.messagePreviews.incoming.CANCEL_REQUEST_MESSAGING',
                  {
                    name: randomName(chat.id),
                  }
                )}
              </InfoSquare>
            )}
          </YStack>
        </YStack>
      </KeyboardAwareScrollView>
      <Stack mx="$4">
        {requestState === 'requested' &&
          (requestedByMe ? (
            <YStack gap="$2">
              <RerequestOrCancelButton
                onRerequestPressed={onRerequestPressed}
                rerequestButtonDisabled={!text.trim()}
              />
            </YStack>
          ) : (
            <AcceptDeclineButtons />
          ))}
        {requestState === 'cancelled' && (
          <Stack gap="$2">
            <RerequestOrCancelButton
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
          <RerequestOrCancelButton
            onRerequestPressed={onRerequestPressed}
            rerequestButtonDisabled={!text.trim()}
          />
        )}
      </Stack>
    </>
  )
}

export default RequestScreen
