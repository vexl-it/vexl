import {type InvoiceStatus} from '@vexl-next/rest-api/src/services/content/contracts'
import {TextTag, type TextTagVariant} from '@vexl-next/ui'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {donationStatusTranslationKey} from '../utils'

function statusVariant(status: InvoiceStatus): TextTagVariant {
  switch (status) {
    case 'New':
    case 'Processing':
      return 'warning'
    case 'Settled':
    case 'Complete':
    case 'Confirmed':
    case 'Paid':
      return 'success'
    case 'Expired':
      return 'expired'
    case 'Invalid':
      return 'failed'
  }
}

export function DonationStatusTag({
  status,
}: {
  readonly status: InvoiceStatus
}): React.ReactElement {
  const {t} = useTranslation()

  return (
    <TextTag
      variant={statusVariant(status)}
      label={t(donationStatusTranslationKey(status))}
    />
  )
}
