import {Button, Typography} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {Stack, YStack} from 'tamagui'
import * as fromChatAtoms from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import openUrl from '../../../../../utils/openUrl'
import AnonymizationNotice from '../../AnonymizationNotice'
import CalculateAmountCell from './CalculateAmountCell'
import DateAndTimeCell from './DateAndTimeCell'
import MeetingLocationCell from './MeetingLocationCell'
import RevealIdentityCell from './RevealIdentityCell'
import RevealPhoneNumberCell from './RevealPhoneNumberCell'
import SetNetworkCell from './SetNetworkCell'
import TradeRule from './TradeRule'
function SectionTitle({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return (
    <Typography variant="paragraphSmall" color="$foregroundPrimary">
      {children}
    </Typography>
  )
}

function OnlineOrInPersonTrade(): React.ReactElement {
  const {t} = useTranslation()
  const offerForTradeChecklist = useAtomValue(fromChatAtoms.originOfferAtom)

  const top = (
    <Stack gap="$3">
      <Typography variant="heading3" color="$foregroundPrimary">
        {t('tradeChecklist.tradeChecklist')}
      </Typography>
      <Typography variant="description" color="$foregroundSecondary">
        {t('tradeChecklist.agreeOnTradeDetailsSubtitle')}
      </Typography>
    </Stack>
  )

  if (
    !offerForTradeChecklist?.offerInfo.publicPart.locationState.includes(
      'IN_PERSON'
    )
  ) {
    return (
      <YStack gap="$6" f={1}>
        {top}

        <Stack p="$4" gap="$4" br="$5" bc="$backgroundSecondary">
          <Typography
            variant="description"
            color="$accentHighlightPrimary"
            lineHeight={20}
          >
            {t('tradeChecklist.thisDealIsFullyOnline')}
          </Typography>
          <Button
            onPress={() => {
              openUrl(t('tradeChecklist.vexlBlogUrl'))()
            }}
            variant="primary"
            size="medium"
          >
            {t('tradeChecklist.readMoreInFullArticle')}
          </Button>
        </Stack>

        <Stack gap="$3">
          <TradeRule
            ruleNumber={1}
            title={t('tradeChecklist.tradeOnlyWithPeopleYouKnow')}
          />
          <TradeRule
            ruleNumber={2}
            title={t('tradeChecklist.alwaysMoneyBeforeBtc')}
          />
          <TradeRule
            ruleNumber={3}
            title={t('tradeChecklist.watchOutForSuspiciousBehaviour')}
          />
        </Stack>
        <Stack gap="$2">
          <CalculateAmountCell />
          <RevealIdentityCell />
          <RevealPhoneNumberCell />
        </Stack>
        <AnonymizationNotice />
      </YStack>
    )
  }

  return (
    <YStack gap="$6" f={1}>
      {top}

      <Stack gap="$3">
        <SectionTitle>{t('tradeChecklist.meetingDetail')}</SectionTitle>
        <Stack gap="$2">
          <DateAndTimeCell />
          <MeetingLocationCell />
        </Stack>
      </Stack>

      <Stack gap="$3">
        <SectionTitle>{t('tradeChecklist.paymentDetail')}</SectionTitle>
        <Stack gap="$2">
          <CalculateAmountCell />
          <SetNetworkCell />
        </Stack>
      </Stack>

      <Stack gap="$3">
        <SectionTitle>{t('tradeChecklist.privacy')}</SectionTitle>
        <Stack gap="$2">
          <RevealIdentityCell />
          <RevealPhoneNumberCell />
        </Stack>
      </Stack>
    </YStack>
  )
}

export default OnlineOrInPersonTrade
