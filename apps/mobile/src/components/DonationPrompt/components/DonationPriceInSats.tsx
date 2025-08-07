import {useAtomValue, useSetAtom} from 'jotai'
import {useEffect, useMemo} from 'react'
import {Text, XStack} from 'tamagui'
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

function DonationPriceInSats(): JSX.Element {
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
      <Text col="$greyAccent2">
        {`${t('offer.approximatelyAbbreviation')}`}
      </Text>
      {btcPriceWithState?.state === 'loading' ? (
        <VexlActivityIndicator size="small" bc="$greyAccent2" />
      ) : (
        <Text col="$greyAccent2">{localizedDonationInSats}</Text>
      )}
      <Text col="$greyAccent2">{t('common.SATS')}</Text>
      <Text col="$greyAccent2">{`(${t('settings.btcPriceSourceCreditYadio')})`}</Text>
    </XStack>
  )
}

export default DonationPriceInSats
