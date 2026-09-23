import {type InvoiceStatus} from '@vexl-next/rest-api/src/services/content/contracts'
import {Stack, Typography} from '@vexl-next/ui'
import React from 'react'
import {styled} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {donationStatusTranslationKey} from '../utils'

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
  const label = t(donationStatusTranslationKey(status))

  switch (status) {
    case 'New':
    case 'Processing':
      return (
        <StatusTagFrame backgroundColor="$accentYellowSecondary">
          <Typography variant="micro" color="$accentHighlightPrimary">
            {label}
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
            {label}
          </Typography>
        </StatusTagFrame>
      )
    case 'Expired':
      return (
        <StatusTagFrame backgroundColor="$backgroundHighlight">
          <Typography variant="micro" color="$foregroundPrimary">
            {label}
          </Typography>
        </StatusTagFrame>
      )
    case 'Invalid':
      return (
        <StatusTagFrame backgroundColor="$redBackground">
          <Typography variant="micro" color="$foregroundPrimary">
            {label}
          </Typography>
        </StatusTagFrame>
      )
  }
}
