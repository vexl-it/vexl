import Clipboard from '@react-native-clipboard/clipboard'
import {
  DonationThanksHeartGraphic,
  EmptyState,
  Screen,
  ScrollView,
  YStack,
} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React from 'react'
import {getTokens} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {toastNotificationAtom} from '../ToastNotification/atom'
import {DonationDetailsNavigationBar} from './DonationDetailsNavigationBar'
import {
  DonationSummaryCard,
  type DonationSummaryData,
} from './DonationDetailsSummary'
import {DonationDetailTitleRow} from './DonationDetailTitleRow'

export function SettledDonationDetails({
  footerHeight,
  title,
  summary,
  paidAt,
}: {
  readonly footerHeight: number
  readonly title: string
  readonly summary: DonationSummaryData
  readonly paidAt: string
}): React.ReactElement {
  const {t} = useTranslation()
  const tokens = getTokens()
  const setToastNotification = useSetAtom(toastNotificationAtom)

  return (
    <Screen
      navigationBar={
        <DonationDetailsNavigationBar title={t('donations.detail.title')} />
      }
    >
      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: footerHeight + tokens.space.$5.val,
        }}
      >
        <YStack gap="$5">
          <DonationDetailTitleRow title={title} status="Settled" />
          <EmptyState
            framed
            graphic={<DonationThanksHeartGraphic />}
            title={t('donations.detail.thanksTitle')}
            description={t('donations.detail.thanksDescription')}
          />
          <DonationSummaryCard
            summary={summary}
            finalTimestampLabel={t('donations.detail.paidAt')}
            finalTimestampValue={paidAt}
            onCopyInvoiceId={() => {
              Clipboard.setString(summary.invoiceId)
              setToastNotification(t('donations.copiedToClipboard'))
            }}
          />
        </YStack>
      </ScrollView>
    </Screen>
  )
}
