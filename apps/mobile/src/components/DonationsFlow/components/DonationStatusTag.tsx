import {type InvoiceStatus} from '@vexl-next/rest-api/src/services/content/contracts'
import {Stack, Typography} from '@vexl-next/ui'
import React from 'react'
import {styled} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'

const StatusTagFrame = styled(Stack, {
  name: 'DonationStatusTag',
  alignItems: 'center',
  justifyContent: 'center',
  height: '$7',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderTopLeftRadius: '$4',
  borderTopRightRadius: '$1',
  borderBottomLeftRadius: '$1',
  borderBottomRightRadius: '$4',
})

export function DonationStatusTag({
  status,
}: {
  readonly status: InvoiceStatus
}): React.ReactElement {
  const {t} = useTranslation()

  switch (status) {
    case 'New':
    case 'Processing':
      return (
        <StatusTagFrame backgroundColor="$accentYellowSecondary">
          <Typography variant="micro" color="$accentHighlightPrimary">
            {status === 'New'
              ? t('donations.invoiceStatus.Created')
              : t('donations.invoiceStatus.Processing')}
          </Typography>
        </StatusTagFrame>
      )
    case 'Settled':
    case 'Complete':
    case 'Confirmed':
    case 'Paid':
      return (
        <StatusTagFrame backgroundColor="$greenBackground">
          <Typography variant="micro" color="$greenForeground">
            {status === 'Settled'
              ? t('donations.invoiceStatus.Settled')
              : status === 'Complete'
                ? t('donations.invoiceStatus.Complete')
                : status === 'Confirmed'
                  ? t('donations.invoiceStatus.Confirmed')
                  : t('donations.invoiceStatus.Paid')}
          </Typography>
        </StatusTagFrame>
      )
    case 'Expired':
      return (
        <StatusTagFrame backgroundColor="$backgroundHighlight">
          <Typography variant="micro" color="$foregroundPrimary">
            {t('donations.invoiceStatus.Expired')}
          </Typography>
        </StatusTagFrame>
      )
    case 'Invalid':
      return (
        <StatusTagFrame backgroundColor="$redBackground">
          <Typography variant="micro" color="$foregroundPrimary">
            {t('donations.invoiceStatus.Invalid')}
          </Typography>
        </StatusTagFrame>
      )
  }
}
