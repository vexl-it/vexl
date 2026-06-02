import {
  Button,
  NavigationBar,
  Screen,
  Typography,
  useScreenFooterHeight,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
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
import useSafeGoBack from '../../utils/useSafeGoBack'
import {updateSingleInvoiceStatusTypeRepeatingActionAtom} from '../DonationPrompt/atoms'
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
  const localizeDecimalNumber = useSetAtom(localizedDecimalNumberActionAtom)
  const localizePrice = useSetAtom(localizedPriceActionAtom)
  const updateSingleInvoiceStatusTypeRepeating = useSetAtom(
    updateSingleInvoiceStatusTypeRepeatingActionAtom
  )
  const safeGoBack = useSafeGoBack()

  const navigationBar = (
    <NavigationBar
      style="back"
      title={t('donations.detail.title')}
      rightActions={[{icon: XmarkCancelClose, onPress: safeGoBack}]}
    />
  )

  useEffect(() => {
    const storeId = mySingleDonation?.storeId
    if (!storeId) return

    const fiber = Effect.runFork(
      updateSingleInvoiceStatusTypeRepeating({invoiceId, storeId})
    )

    return () => {
      Effect.runFork(Fiber.interrupt(fiber))
    }
  }, [
    invoiceId,
    mySingleDonation?.storeId,
    updateSingleInvoiceStatusTypeRepeating,
  ])

  if (!mySingleDonation) {
    return (
      <Screen
        navigationBar={navigationBar}
        footer={
          <Button variant="primary" onPress={safeGoBack} width="100%">
            {t('common.back')}
          </Button>
        }
      >
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Typography
            variant="titlesSmall"
            color="$foregroundPrimary"
            textAlign="center"
          >
            {t('donations.detail.donationNotFound')}
          </Typography>
        </YStack>
      </Screen>
    )
  }

  const satsAmount = Number(mySingleDonation.btcAmount) * SATOSHIS_IN_BTC
  const localizedTotalSats = localizeDecimalNumber({
    number: satsAmount,
  })
  const localizedFiatAmount = localizePrice({
    number: mySingleDonation.fiatAmount,
    currency: mySingleDonation.currency,
  })
  const localizedExchangeRate = localizePrice({
    number: mySingleDonation.exchangeRate,
    currency: mySingleDonation.currency,
  })
  const status = mySingleDonation.status
  const paymentMethod = mySingleDonation.paymentMethod
  const paymentLink = mySingleDonation.paymentLink
  const isLightning = paymentMethod !== 'BTC-CHAIN'
  const localizedSatsAmount = `${localizedTotalSats} sats`
  const title = donationTitle({paymentMethod, t})
  const invoiceIdValue = mySingleDonation.invoiceId
  const createdAt = formatDateTime(
    timestampToDateTime(mySingleDonation.createdTime).toMillis(),
    locale
  )
  const expiredAt = formatDateTime(
    timestampToDateTime(mySingleDonation.expirationTime).toMillis(),
    locale
  )
  const summary: DonationSummaryData = {
    localizedSatsAmount,
    localizedFiatAmount: `${localizedFiatAmount}`,
    localizedExchangeRate: `${localizedExchangeRate}`,
    invoiceId: invoiceIdValue,
    createdAt,
  }
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
