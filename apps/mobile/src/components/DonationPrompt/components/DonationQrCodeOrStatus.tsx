import {type InvoiceId} from '@vexl-next/rest-api/src/services/content/contracts'
import {Effect, Fiber} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect, useMemo} from 'react'
import {Stack, Text, XStack} from 'tamagui'
import {SATOSHIS_IN_BTC} from '../../../state/currentBtcPriceAtoms'
import {singleDonationAtom} from '../../../state/donations/atom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {
  localizedDecimalNumberActionAtom,
  localizedPriceActionAtom,
} from '../../../utils/localization/localizedNumbersAtoms'
import BtcInvoiceStatus from '../../BtcInvoiceStatus'
import {
  dummyDonation,
  updateSingleInvoiceStatusTypeRepeatingActionAtom,
} from '../atoms'
import {donationPaymentMethodAtom} from '../atoms/stateAtoms'

interface Props {
  readonly invoiceId: InvoiceId
}

function DonationQrCodeOrStatus({invoiceId}: Props): React.ReactElement {
  const {t} = useTranslation()
  const {
    btcAmount,
    exchangeRate,
    fiatAmount,
    currency,
    paymentLink,
    status,
    storeId,
  } =
    useAtomValue(useMemo(() => singleDonationAtom(invoiceId), [invoiceId])) ??
    dummyDonation
  const localizedSatsAmount = useSetAtom(localizedDecimalNumberActionAtom)({
    number: Number(btcAmount) * SATOSHIS_IN_BTC,
  })
  const localizedFiatAmount = useSetAtom(localizedPriceActionAtom)({
    number: fiatAmount,
    currency,
  })
  const localizedExchangeRate = useSetAtom(localizedPriceActionAtom)({
    number: exchangeRate,
    currency,
  })
  const updateSingleInvoiceStatusTypeRepeating = useSetAtom(
    updateSingleInvoiceStatusTypeRepeatingActionAtom
  )
  const donationPaymentMethod = useAtomValue(donationPaymentMethodAtom)

  useEffect(() => {
    const fiber = Effect.runFork(
      updateSingleInvoiceStatusTypeRepeating({invoiceId, storeId})
    )

    return () => {
      Effect.runFork(Fiber.interrupt(fiber))
    }
  }, [invoiceId, storeId, updateSingleInvoiceStatusTypeRepeating])

  return (
    <Stack f={1} gap="$4">
      <Text col="$black" fos={28} ff="$heading" textAlign="center">
        {t('donationPrompt.vexlFoundationDonate')}
      </Text>
      <Stack gap="$2">
        <XStack ai="center" jc="space-between">
          <Text col="$black" fos={14} ff="$body500">
            {t('donationPrompt.totalPrice')}
          </Text>
          <Text col="$black" fos={14} ff="$body500">
            {`${localizedSatsAmount} sats`}
          </Text>
        </XStack>
        <XStack ai="center" jc="space-between">
          <Text col="$black" fos={14} ff="$body500">
            {t('donationPrompt.totalFiat')}
          </Text>
          <Text col="$black" fos={14} ff="$body500">
            {localizedFiatAmount}
          </Text>
        </XStack>
        <XStack ai="center" jc="space-between">
          <Text col="$black" fos={14} ff="$body500">
            {t('donationPrompt.exchangeRate')}
          </Text>
          <Text col="$black" fos={14} ff="$body500">
            {`1 BTC = ${localizedExchangeRate}`}
          </Text>
        </XStack>
        <XStack ai="center" jc="space-between">
          <Text col="$black" fos={14} ff="$body500">
            {t('donationPrompt.amountDue')}
          </Text>
          <Text col="$black" fos={14} ff="$body500">
            {`${localizedSatsAmount} sats`}
          </Text>
        </XStack>
      </Stack>
      <BtcInvoiceStatus
        isInModal
        paymentLink={paymentLink}
        status={status}
        donationPaymentMethod={donationPaymentMethod}
      />
    </Stack>
  )
}

export default DonationQrCodeOrStatus
