import {
  Copy,
  DetailsCard,
  KeyValueRow,
  Typography,
  useTheme,
  XStack,
} from '@vexl-next/ui'
import React from 'react'
import {useTranslation} from '../../utils/localization/I18nProvider'

export interface DonationSummaryData {
  readonly localizedSatsAmount: string
  readonly localizedFiatAmount: string
  readonly localizedExchangeRate: string
  readonly invoiceId: string
  readonly createdAt: string
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
    <DetailsCard>
      <KeyValueRow
        label={t('donationPrompt.totalPrice')}
        value={summary.localizedSatsAmount}
        numberOfLines={1}
      />
      <KeyValueRow
        label={t('donationPrompt.totalFiat')}
        value={summary.localizedFiatAmount}
        numberOfLines={1}
      />
      <KeyValueRow
        label={t('donationPrompt.exchangeRate')}
        value={`1 BTC = ${summary.localizedExchangeRate}`}
        numberOfLines={1}
      />
      <KeyValueRow
        label={t('donationPrompt.amountDue')}
        value={summary.localizedSatsAmount}
        numberOfLines={1}
      />
      {onCopyInvoiceId ? (
        <KeyValueRow label={t('donations.detail.invoiceId')}>
          <XStack
            flex={1}
            alignItems="center"
            justifyContent="flex-end"
            gap="$1"
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
        </KeyValueRow>
      ) : (
        <KeyValueRow
          label={t('donations.detail.invoiceId')}
          value={summary.invoiceId}
          numberOfLines={1}
        />
      )}
      <KeyValueRow
        label={t('donationPrompt.createdAt')}
        value={summary.createdAt}
        numberOfLines={1}
      />
      {finalTimestampLabel && finalTimestampValue ? (
        <KeyValueRow
          label={finalTimestampLabel}
          value={finalTimestampValue}
          numberOfLines={1}
        />
      ) : null}
    </DetailsCard>
  )
}
