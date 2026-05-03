import {useNavigation} from '@react-navigation/native'
import {Button, Calendar, Typography, XStack, YStack} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array as ArrayE, Option, pipe} from 'effect'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import {DateTime} from 'luxon'
import React from 'react'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import * as dateAndTime from '../../../../../state/tradeChecklist/utils/dateAndTime'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {chatMolecule} from '../../../atoms'
import VexlbotActionCard from './VexlbotActionCard'
import VexlbotNextActionSuggestion from './VexlbotNextActionSuggestion'

interface Props {
  message: ChatMessageWithState
}

function DateTimeDetails({
  details,
  textColor,
}: {
  readonly details: readonly string[]
  readonly textColor: '$foregroundSecondary' | '$foregroundTertiary'
}): React.JSX.Element {
  const {t} = useTranslation()

  return (
    <YStack gap="$2">
      {pipe(
        details,
        ArrayE.map((detail, index) => (
          <XStack
            key={`${detail}-${String(index)}`}
            alignItems="center"
            gap="$2"
          >
            <Typography color={textColor} flex={1} variant="description">
              {detail}
            </Typography>
          </XStack>
        ))
      )}
    </YStack>
  )
}

export default function TradeChecklistDateAndTimeView({
  message,
}: Props): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const {
    addEventToCalendarActionAtom,
    tradeChecklistDateAndTimeAtom,
    chatAtom,
    lastTradeChecklistMessageAtom,
  } = useMolecule(chatMolecule)
  const store = useStore()
  const lastTradeChecklistMessage = useAtomValue(lastTradeChecklistMessageAtom)
  const dateAndTimeData = useAtomValue(tradeChecklistDateAndTimeAtom)
  const latestDateAndTimeDataMessageTimestamp =
    dateAndTime.getLatestMessageTimestamp(dateAndTimeData)
  const addEventToCalendar = useSetAtom(addEventToCalendarActionAtom)

  if (
    (message.state === 'sent' || message.state === 'received') &&
    message.message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
    message.message.tradeChecklistUpdate?.dateAndTime
  ) {
    const isMessageOutdated =
      message.message.tradeChecklistUpdate.dateAndTime?.timestamp !==
      latestDateAndTimeDataMessageTimestamp

    const pick = message.message.tradeChecklistUpdate.dateAndTime.picks

    if (!!pick && !isMessageOutdated) {
      const acceptedDetails = [dateAndTime.toStringWithTime(pick.dateTime)]

      return (
        <>
          <VexlbotActionCard
            mb="$2"
            statusLabel={t('common.accepted')}
            statusVariant="waiting"
            title={t('vexlbot.yourMeetingIsOn')}
          >
            <YStack gap="$3">
              <DateTimeDetails
                details={acceptedDetails}
                textColor="$foregroundSecondary"
              />
              <Button
                icon={Calendar}
                onPress={() => {
                  void addEventToCalendar()()
                }}
                size="small"
                variant="secondary"
                width="100%"
              >
                {t('vexlbot.addEventToCalendar')}
              </Button>
            </YStack>
          </VexlbotActionCard>
          {Option.isSome(lastTradeChecklistMessage) &&
            lastTradeChecklistMessage.value.message.uuid ===
              message.message.uuid && <VexlbotNextActionSuggestion />}
        </>
      )
    }

    const suggestions =
      message.message.tradeChecklistUpdate.dateAndTime.suggestions
    if (suggestions && suggestions.length > 0) {
      const detailLines = pipe(
        suggestions,
        ArrayE.map((one) =>
          // TODO: remove this in future once everybody
          // updates to new DateTime checklist system
          // use toStringWithTime(one.to)
          DateTime.fromMillis(one.to).diff(
            DateTime.fromMillis(one.from),
            'hours'
          ).hours >= 1
            ? dateAndTime.toStringWithRange(one)
            : dateAndTime.toStringWithTime(one.to)
        )
      )
      const pendingLabel =
        message.state === 'received'
          ? t('vexlbot.reactionRequired')
          : t('vexlbot.waitingFor', {username: t('common.otherSide')})

      return (
        <VexlbotActionCard
          mb="$2"
          statusLabel={isMessageOutdated ? t('common.outdated') : pendingLabel}
          statusVariant={
            isMessageOutdated ? 'outdated' : 'waitingForConfirmation'
          }
          title={
            message.state === 'received'
              ? t('vexlbot.confirmMeetingDate')
              : t('vexlbot.suggestedMeetingDate')
          }
        >
          <YStack gap="$2">
            {message.state === 'received' && (
              <Typography
                color={
                  isMessageOutdated
                    ? '$foregroundTertiary'
                    : '$foregroundSecondary'
                }
                flex={1}
                variant="description"
              >
                {t('vexlbot.picktimeOrSuggestYourOwn')}
              </Typography>
            )}

            <DateTimeDetails
              details={detailLines}
              textColor={
                isMessageOutdated
                  ? '$foregroundTertiary'
                  : '$foregroundSecondary'
              }
            />
            {message.state === 'received' && !isMessageOutdated ? (
              <Button
                onPress={() => {
                  const chat = store.get(chatAtom)
                  navigation.navigate('TradeChecklistFlow', {
                    chatId: chat.id,
                    inboxKey: chat.inbox.privateKey.publicKeyPemBase64,
                    screen: 'PickDateFromSuggestions',
                    params: {
                      chosenDateTimes: suggestions,
                    },
                  })
                }}
                size="medium"
                variant="secondary"
                width="100%"
              >
                {t('common.respond')}
              </Button>
            ) : null}
          </YStack>
        </VexlbotActionCard>
      )
    }
  }

  return null
}
