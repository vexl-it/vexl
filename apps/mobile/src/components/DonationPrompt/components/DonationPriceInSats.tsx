import {Typography, XStack} from '@vexl-next/ui'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect, useMemo} from 'react'
import {
  createBtcPriceForCurrencyAtom,
  refreshBtcPriceActionAtom,
  SATOSHIS_IN_BTC,
} from '../../../state/currentBtcPriceAtoms'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {localizedDecimalNumberActionAtom} from '../../../utils/localization/localizedNumbersAtoms'
import VexlActivityIndicator from '../../LoadingOverlayProvider/VexlActivityIndicator'
import {
  donationAmountAtom,
  selectedPredefinedDonationValueAtom,
} from '../atoms/stateAtoms'

function DonationPriceInSats(): React.ReactElement {
  const {t} = useTranslation()

  const donationAmount = useAtomValue(donationAmountAtom)
  const selectedPredefinedDonationValue = useAtomValue(
    selectedPredefinedDonationValueAtom
  )
  const refreshBtcPrice = useSetAtom(refreshBtcPriceActionAtom)
  const btcPriceWithState = useAtomValue(
    useMemo(() => createBtcPriceForCurrencyAtom('EUR'), [])
  )

  const donationInSats = useMemo(() => {
    if (donationAmount && btcPriceWithState?.btcPrice) {
      return Math.round(
        (Number(donationAmount) / btcPriceWithState.btcPrice.BTC) *
          SATOSHIS_IN_BTC
      )
    }

    if (selectedPredefinedDonationValue && btcPriceWithState?.btcPrice) {
      return Math.round(
        (Number(selectedPredefinedDonationValue) /
          btcPriceWithState.btcPrice.BTC) *
          SATOSHIS_IN_BTC
      )
    }

    return 0
  }, [
    btcPriceWithState?.btcPrice,
    donationAmount,
    selectedPredefinedDonationValue,
  ])
  const localizedDonationInSats = useSetAtom(localizedDecimalNumberActionAtom)({
    number: donationInSats,
  })

  useEffect(() => {
    void refreshBtcPrice('EUR')()
  }, [refreshBtcPrice])

  return (
    <XStack als="flex-start" gap="$1" ai="center" flexWrap="wrap">
      <Typography variant="description" color="$foregroundSecondary">
        {`${t('offer.approximatelyAbbreviation')}`}
      </Typography>
      {btcPriceWithState?.state === 'loading' ? (
        <VexlActivityIndicator size="small" bc="$backgroundTertiary" />
      ) : (
        <Typography variant="description" color="$foregroundPrimary">
          {localizedDonationInSats}
        </Typography>
      )}
      <Typography variant="description" color="$foregroundPrimary">
        {t('common.SATS')}
      </Typography>
      <Typography variant="description" color="$foregroundSecondary">
        {`(${t('settings.btcPriceSourceCreditYadio')})`}
      </Typography>
    </XStack>
  )
}

export default DonationPriceInSats
