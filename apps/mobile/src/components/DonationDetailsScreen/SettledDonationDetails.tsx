import Clipboard from '@react-native-clipboard/clipboard'
import {
  DonationThanksHeartGraphic,
  EmptyState,
  Screen,
  YStack,
} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React from 'react'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {toastNotificationAtom} from '../ToastNotification/atom'
import {DonationDetailsNavigationBar} from './DonationDetailsNavigationBar'
import {
  DonationSummaryCard,
  type DonationSummaryData,
} from './DonationDetailsSummary'
import {DonationDetailTitleRow} from './DonationDetailTitleRow'

export function SettledDonationDetails({
  title,
  summary,
  paidAt,
}: {
  readonly title: string
  readonly summary: DonationSummaryData
  readonly paidAt: string
}): React.ReactElement {
  const {t} = useTranslation()
  const setToastNotification = useSetAtom(toastNotificationAtom)

  return (
    <Screen
      scrollable
      navigationBar={
        <DonationDetailsNavigationBar title={t('donations.detail.title')} />
      }
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
    </Screen>
  )
}
