import {useNavigation} from '@react-navigation/native'
import {
  Button,
  Calendar,
  ClockTime,
  darkTheme,
  lightTheme,
  tokens,
  Typography,
  useTheme,
  XStack,
  YStack,
  type IconProps,
} from '@vexl-next/ui'
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
  icon: Icon,
  iconColor,
  textColor,
}: {
  readonly details: readonly string[]
  readonly icon: React.ComponentType<IconProps>
  readonly iconColor: string
  readonly textColor: '$foregroundSecondary' | '$foregroundTertiary'
}): React.JSX.Element {
  const detailIconSize = tokens.size[6].val

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
            <Icon color={iconColor} size={detailIconSize} />
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
  const theme = useTheme()
  const {
    addEventToCalendarActionAtom,
    tradeChecklistDateAndTimeAtom,
    otherSideDataAtom,
    chatAtom,
    lastTradeChecklistMessageAtom,
  } = useMolecule(chatMolecule)
  const store = useStore()
  const lastTradeChecklistMessage = useAtomValue(lastTradeChecklistMessageAtom)
  const dateAndTimeData = useAtomValue(tradeChecklistDateAndTimeAtom)
  const latestDateAndTimeDataMessageTimestamp =
    dateAndTime.getLatestMessageTimestamp(dateAndTimeData)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const addEventToCalendar = useSetAtom(addEventToCalendarActionAtom)
  const isDarkTheme =
    theme.backgroundPrimary.val === darkTheme.backgroundPrimary
  const activeDetailIconColor = isDarkTheme
    ? darkTheme.foregroundSecondary
    : lightTheme.foregroundSecondary
  const outdatedDetailIconColor = isDarkTheme
    ? darkTheme.foregroundTertiary
    : lightTheme.foregroundTertiary

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
            statusLabel={t('common.accepted')}
            statusVariant="waiting"
            title={t('vexlbot.yourMeetingIsOn')}
          >
            <YStack gap="$3">
              <DateTimeDetails
                details={acceptedDetails}
                icon={Calendar}
                iconColor={activeDetailIconColor}
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
          : otherSideData.userName
            ? t('vexlbot.waitingFor', {username: otherSideData.userName})
            : t('vexlbot.waitingForCounterParty')

      return (
        <VexlbotActionCard
          description={t(
            message.state === 'sent'
              ? 'vexlbot.youAddedTimeOptions'
              : 'vexlbot.themAddedTimeOptions',
            {
              them: otherSideData.userName,
              number: suggestions.length,
            }
          )}
          statusLabel={isMessageOutdated ? t('common.outdated') : pendingLabel}
          statusVariant={
            isMessageOutdated ? 'outdated' : 'waitingForConfirmation'
          }
          title={t('tradeChecklist.options.DATE_AND_TIME')}
        >
          <YStack gap="$3">
            <DateTimeDetails
              details={detailLines}
              icon={ClockTime}
              iconColor={
                isMessageOutdated
                  ? outdatedDetailIconColor
                  : activeDetailIconColor
              }
              textColor={
                isMessageOutdated
                  ? '$foregroundTertiary'
                  : '$foregroundSecondary'
              }
            />
            {message.state === 'received' && !isMessageOutdated ? (
              <Button
                icon={ClockTime}
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
                size="small"
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
