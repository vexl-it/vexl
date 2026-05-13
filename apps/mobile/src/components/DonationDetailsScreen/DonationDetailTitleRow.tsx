import {type InvoiceStatus} from '@vexl-next/rest-api/src/services/content/contracts'
import {Typography, XStack} from '@vexl-next/ui'
import React from 'react'
import {DonationStatusTag} from '../DonationsFlow/components/DonationStatusTag'

export function DonationDetailTitleRow({
  title,
  status,
}: {
  readonly title: string
  readonly status: InvoiceStatus
}): React.ReactElement {
  return (
    <XStack alignItems="center" gap="$4">
      <Typography
        variant="paragraphDemibold"
        color="$foregroundPrimary"
        numberOfLines={1}
        flex={1}
      >
        {title}
      </Typography>
      <DonationStatusTag status={status} />
    </XStack>
  )
}
