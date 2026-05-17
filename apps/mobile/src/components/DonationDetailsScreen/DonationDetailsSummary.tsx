import {Copy, Typography, useTheme, XStack, YStack} from '@vexl-next/ui'
import React from 'react'
import {useTranslation} from '../../utils/localization/I18nProvider'

interface SummaryRowProps {
  readonly label: string
  readonly value?: string
  readonly children?: React.ReactNode
}

export interface DonationSummaryData {
  readonly localizedSatsAmount: string
  readonly localizedFiatAmount: string
  readonly localizedExchangeRate: string
  readonly invoiceId: string
  readonly createdAt: string
}

export function SummaryRow({
  label,
  value,
  children,
}: SummaryRowProps): React.ReactElement {
  return (
    <XStack alignItems="center" justifyContent="space-between" gap="$4">
      <Typography
        variant="micro"
        color="$foregroundSecondary"
        flex={1}
        numberOfLines={1}
      >
        {label}
      </Typography>
      {children ?? (
        <Typography
          variant="descriptionBold"
          color="$foregroundPrimary"
          numberOfLines={1}
          flexShrink={1}
        >
          {value}
        </Typography>
      )}
    </XStack>
  )
}

export function Card({
  children,
}: {
  readonly children: React.ReactNode
}): React.ReactElement {
  return (
    <YStack
      backgroundColor="$backgroundSecondary"
      borderRadius="$5"
      padding="$4"
      gap="$5"
    >
      {children}
    </YStack>
  )
}

export function DonationSummaryCard({
  summary,
  finalTimestampLabel,
  finalTimestampValue,
  onCopyInvoiceId,
}: {
  readonly summary: DonationSummaryData
  readonly finalTimestampLabel?: string
  readonly finalTimestampValue?: string
  readonly onCopyInvoiceId?: () => void
}): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()

  return (
    <Card>
      <SummaryRow
        label={t('donationPrompt.totalPrice')}
        value={summary.localizedSatsAmount}
      />
      <SummaryRow
        label={t('donationPrompt.totalFiat')}
        value={`${summary.localizedFiatAmount}`}
      />
      <SummaryRow
        label={t('donationPrompt.exchangeRate')}
        value={`1 BTC = ${summary.localizedExchangeRate}`}
      />
      <SummaryRow
        label={t('donationPrompt.amountDue')}
        value={summary.localizedSatsAmount}
      />
      {onCopyInvoiceId ? (
        <SummaryRow label={t('donations.detail.invoiceId')}>
          <XStack
            alignItems="center"
            gap="$1"
            flexShrink={1}
            pressStyle={{opacity: 0.7}}
            onPress={onCopyInvoiceId}
          >
            <Copy size={18} color={theme.foregroundPrimary.get()} />
            <Typography
              variant="descriptionBold"
              color="$foregroundPrimary"
              numberOfLines={1}
              flexShrink={1}
            >
              {summary.invoiceId}
            </Typography>
          </XStack>
        </SummaryRow>
      ) : (
        <SummaryRow
          label={t('donations.detail.invoiceId')}
          value={summary.invoiceId}
        />
      )}
      <SummaryRow
        label={t('donationPrompt.createdAt')}
        value={summary.createdAt}
      />
      {finalTimestampLabel && finalTimestampValue ? (
        <SummaryRow label={finalTimestampLabel} value={finalTimestampValue} />
      ) : null}
    </Card>
  )
}
