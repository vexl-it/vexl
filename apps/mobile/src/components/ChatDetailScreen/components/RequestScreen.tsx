import {
  Button,
  InfoCircle,
  RowButton,
  ScrollView,
  Stack,
  TrashBin,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Platform, TouchableOpacity} from 'react-native'
import {KeyboardStickyView} from 'react-native-keyboard-controller'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {andThenExpectBooleanNoErrors} from '../../../utils/andThenExpectNoErrors'
import getRerequestPossibleInDaysText from '../../../utils/getRerequestPossibleInDaysText'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import InfoSquare from '../../InfoSquare'
import {chatMolecule} from '../atoms'
import AcceptDeclineButtons from './AcceptDeclineButtons'
import ChatRequestPreview from './ChatRequestPreview'
import RequestScreenChatHeader from './RequestScreenChatHeader'
import RerequestOrCancelButton from './RerequestOrCancelButton'

function RequestScreen(): React.ReactElement {
  const {
    offerForChatAtom,
    requestMessageAtom,
    deleteChatWithUiFeedbackAtom,
    forceShowHistoryAtom,
    requestStateAtom,
    hasPreviousCommunicationAtom,
    canBeRerequestedAtom,
    otherSideDataAtom,
    deniedMessageAtom,
  } = useMolecule(chatMolecule)
  const offer = useAtomValue(offerForChatAtom)
  const {t} = useTranslation()
  const saveInsets = useSafeAreaInsets()

  const requestState = useAtomValue(requestStateAtom)
  const requestMessage = useAtomValue(requestMessageAtom)
  const deniedMessage = useAtomValue(deniedMessageAtom)
  const deleteChatWithUiFeedback = useSetAtom(deleteChatWithUiFeedbackAtom)
  const safeGoBack = useSafeGoBack()
  const setForceShowHistory = useSetAtom(forceShowHistoryAtom)
  const hasPreviousCommunication = useAtomValue(hasPreviousCommunicationAtom)
  const canBeRerequested = useAtomValue(canBeRerequestedAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)

  const rerequestText = !canBeRerequested.canBeRerequested
    ? getRerequestPossibleInDaysText(canBeRerequested.possibleInDays, t)
    : null

  const onHistoryPress = useCallback(() => {
    setForceShowHistory((v) => !v)
  }, [setForceShowHistory])

  const requestedByMe = requestMessage?.state === 'sent'

  // const previousCommunicationInfoMessageIncludingClubs = useMemo(() => {
  //   if (!offer || (offer && offer.offerInfo.privatePart.clubIds.length === 0))
  //     return previousCommunicationInfoMessage

  //   const clubsNames = pipe(
  //     clubsWithMembers,
  //     Array.filter((club) =>
  //       Array.contains(club.club.uuid)(offer.offerInfo.privatePart.clubIds)
  //     ),
  //     Array.map((club) => club.club.name)
  //   )

  //   return `${previousCommunicationInfoMessage} ${t(
  //     'messages.thisUserIsAlsoMemberOff',
  //     {
  //       clubs: `${clubsNames.join(`, `)}`,
  //     }
  //   )}`
  // }, [clubsWithMembers, offer, previousCommunicationInfoMessage, t])

  return (
    <Stack f={1} mt={saveInsets.top} mb={saveInsets.bottom}>
      <RequestScreenChatHeader />
      <ScrollView
        style={{flex: 1}}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$6" f={1} mx="$5" mt="$6">
          {!!offer && <ChatRequestPreview />}

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
            {!!rerequestText && <InfoSquare>{rerequestText}</InfoSquare>}

            {requestState === 'denied' && !requestedByMe && (
              <YStack gap="$6">
                {!!deniedMessage?.message.text && (
                  <YStack
                    gap="$3"
                    borderRadius="$5"
                    backgroundColor="$backgroundSecondary"
                    p="$4"
                  >
                    <Typography variant="micro" color="$foregroundSecondary">
                      {t('messages.yourReasonForRejection')}
                    </Typography>

                    <Typography variant="paragraph" color="$foregroundPrimary">
                      {deniedMessage?.message.text}
                    </Typography>
                  </YStack>
                )}

                <RowButton
                  variant="red"
                  icon={TrashBin}
                  label={t('messages.deleteConversation')}
                  onPress={() => {
                    void Effect.runPromise(
                      andThenExpectBooleanNoErrors((success) => {
                        if (success) {
                          safeGoBack()
                        }
                      })(deleteChatWithUiFeedback({skipAsk: false}))
                    )
                  }}
                />

                <TouchableOpacity
                  onPress={() => {
                    // TODO
                  }}
                >
                  <XStack
                    f={1}
                    borderRadius="$5"
                    alignItems="center"
                    gap="$2"
                    backgroundColor="$pinkBackground"
                    px="$4"
                    py="$6"
                  >
                    <InfoCircle size={18} color="$foregroundPrimary" />
                    <Typography
                      f={1}
                      variant="description"
                      color="$foregroundPrimary"
                    >
                      {t('messages.youDeclinedThisOffer')}
                    </Typography>
                  </XStack>
                </TouchableOpacity>
              </YStack>
            )}

            {requestState === 'cancelled' && (
              <InfoSquare negative>
                {t(
                  'messages.messagePreviews.incoming.CANCEL_REQUEST_MESSAGING',
                  {
                    name: otherSideData.userName,
                  }
                )}
              </InfoSquare>
            )}
          </YStack>
        </YStack>
        <Stack mx="$4">
          {requestState === 'requested' && !!requestedByMe && (
            <YStack gap="$2">
              <RerequestOrCancelButton />
            </YStack>
          )}
          {requestState === 'cancelled' && (
            <Stack gap="$2">
              <RerequestOrCancelButton />
              <Button
                variant="secondary"
                width="100%"
                onPress={() => {
                  void Effect.runPromise(
                    andThenExpectBooleanNoErrors((success) => {
                      if (success) {
                        safeGoBack()
                      }
                    })(deleteChatWithUiFeedback({skipAsk: false}))
                  )
                }}
              >
                {t('messages.deleteChat')}
              </Button>
            </Stack>
          )}
          {requestState === 'denied' && <RerequestOrCancelButton />}
        </Stack>
      </ScrollView>
      {requestState === 'requested' && !requestedByMe && (
        <KeyboardStickyView
          offset={{closed: 10, opened: Platform.OS === 'ios' ? 50 : 0}}
        >
          <AcceptDeclineButtons />
        </KeyboardStickyView>
      )}
    </Stack>
  )
}

export default RequestScreen
