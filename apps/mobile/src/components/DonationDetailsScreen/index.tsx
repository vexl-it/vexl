import {useScreenFooterHeight} from '@vexl-next/ui'
import {Effect, Fiber} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect, useMemo} from 'react'
import {type DonationsFlowScreenProps} from '../../navigationTypes'
import {SATOSHIS_IN_BTC} from '../../state/currentBtcPriceAtoms'
import {singleDonationAtom} from '../../state/donations/atom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {formatDateTime} from '../../utils/localization/formatting'
import {formattingLocaleAtom} from '../../utils/localization/formattingLocaleAtom'
import {
  localizedDecimalNumberActionAtom,
  localizedPriceActionAtom,
} from '../../utils/localization/localizedNumbersAtoms'
import {
  dummyDonation,
  updateSingleInvoiceStatusTypeRepeatingActionAtom,
} from '../DonationPrompt/atoms'
import {donationTitle, timestampToDateTime} from '../DonationsFlow/utils'
import {type DonationSummaryData} from './DonationDetailsSummary'
import {ExpiredDonationDetails} from './ExpiredDonationDetails'
import {InvalidDonationDetails} from './InvalidDonationDetails'
import {NewDonationDetails} from './NewDonationDetails'
import {OtherDonationDetails} from './OtherDonationDetails'
import {SettledDonationDetails} from './SettledDonationDetails'

type Props = DonationsFlowScreenProps<'DonationDetails'>

function DonationDetailsScreen({
  route: {
    params: {invoiceId},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const locale = useAtomValue(formattingLocaleAtom)
  const {footerHeightAtom} = useScreenFooterHeight()
  const footerHeight = useAtomValue(footerHeightAtom)
  const mySingleDonation = useAtomValue(
    useMemo(() => singleDonationAtom(invoiceId), [invoiceId])
  )
  const storeId = mySingleDonation?.storeId ?? dummyDonation.storeId
  const satsAmount = Number(mySingleDonation?.btcAmount ?? 0) * SATOSHIS_IN_BTC
  const localizedTotalSats = useSetAtom(localizedDecimalNumberActionAtom)({
    number: satsAmount,
  })
  const localizedFiatAmount = useSetAtom(localizedPriceActionAtom)({
    number: mySingleDonation?.fiatAmount ?? 0,
    currency: mySingleDonation?.currency,
  })
  const localizedExchangeRate = useSetAtom(localizedPriceActionAtom)({
    number: mySingleDonation?.exchangeRate ?? 0,
    currency: mySingleDonation?.currency,
  })
  const updateSingleInvoiceStatusTypeRepeating = useSetAtom(
    updateSingleInvoiceStatusTypeRepeatingActionAtom
  )
  const status = mySingleDonation?.status ?? dummyDonation.status
  const paymentMethod =
    mySingleDonation?.paymentMethod ?? dummyDonation.paymentMethod
  const paymentLink = mySingleDonation?.paymentLink ?? dummyDonation.paymentLink
  const isLightning = paymentMethod !== 'BTC-CHAIN'
  const localizedSatsAmount = `${localizedTotalSats} sats`
  const title = donationTitle({paymentMethod, t})
  const invoiceIdValue = mySingleDonation?.invoiceId ?? invoiceId
  const createdAt = formatDateTime(
    timestampToDateTime(mySingleDonation?.createdTime ?? 0).toMillis(),
    locale
  )
  const expiredAt = formatDateTime(
    timestampToDateTime(mySingleDonation?.expirationTime ?? 0).toMillis(),
    locale
  )
  const summary: DonationSummaryData = {
    localizedSatsAmount,
    localizedFiatAmount: `${localizedFiatAmount}`,
    localizedExchangeRate: `${localizedExchangeRate}`,
    invoiceId: invoiceIdValue,
    createdAt,
  }
  useEffect(() => {
    const fiber = Effect.runFork(
      updateSingleInvoiceStatusTypeRepeating({invoiceId, storeId})
    )

    return () => {
      Effect.runFork(Fiber.interrupt(fiber))
    }
  }, [invoiceId, storeId, updateSingleInvoiceStatusTypeRepeating])

  return status === 'New' ? (
    <NewDonationDetails
      footerHeight={footerHeight}
      paymentLink={paymentLink}
      isLightning={isLightning}
      summary={summary}
    />
  ) : status === 'Expired' ? (
    <ExpiredDonationDetails
      footerHeight={footerHeight}
      title={title}
      donation={mySingleDonation}
      paymentLink={paymentLink}
      isLightning={isLightning}
      summary={summary}
      expiredAt={expiredAt}
    />
  ) : status === 'Invalid' ? (
    <InvalidDonationDetails
      footerHeight={footerHeight}
      title={title}
      donation={mySingleDonation}
      summary={summary}
      expiredAt={expiredAt}
    />
  ) : status === 'Settled' ? (
    <SettledDonationDetails
      footerHeight={footerHeight}
      title={title}
      summary={summary}
      paidAt={createdAt}
    />
  ) : (
    <OtherDonationDetails
      footerHeight={footerHeight}
      summary={summary}
      paymentMethod={paymentMethod}
      paymentLink={paymentLink}
      status={status}
    />
  )
}

export default DonationDetailsScreen
