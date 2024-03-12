import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {useAtomValue, type PrimitiveAtom, type WritableAtom} from 'jotai'
import {useState} from 'react'
import {Stack, Text, XStack} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {currencies} from '../../../../utils/localization/currency'
import CurrencySelect from '../../../CurrencySelect'
import DropdownSelectButton from '../../../DropdownSelectButton'

interface Props {
  currencyAtom: PrimitiveAtom<CurrencyCode | undefined>
  updateCurrencyLimitsAtom: WritableAtom<
    null,
    [
      {
        currency: CurrencyCode | undefined
      },
    ],
    boolean
  >
}

function CurrencyComponent({
  currencyAtom,
  updateCurrencyLimitsAtom,
}: Props): JSX.Element | null {
  const {t} = useTranslation()
  const currency = useAtomValue(currencyAtom)

  const [currencySelectVisible, setCurrencySelectVisible] =
    useState<boolean>(false)

  return (
    <Stack>
      <Text ff="$body600" fos={16} col="$greyOnBlack" mb="$4">
        {t('offerForm.currencyYouWouldLikeToUse')}
      </Text>
      <DropdownSelectButton
        onPress={() => {
          setCurrencySelectVisible(true)
        }}
      >
        {currency ? (
          <XStack ai="center" space="$1">
            <Text ff="$body600" fos={18} col="$main">
              {currencies[currency].symbol}
            </Text>
            <Text ff="$body600" fos={10} col="$greyOnBlack">
              ●
            </Text>
            <Text ff="$body600" fos={18} col="$main">
              {currencies[currency].code}
            </Text>
          </XStack>
        ) : (
          <Stack>
            <Text ff="$body600" fos={18} col="$greyOnBlack">
              {t('filterOffers.chooseCurrency')}
            </Text>
          </Stack>
        )}
      </DropdownSelectButton>
      <CurrencySelect
        selectedCurrencyCodeAtom={currencyAtom}
        onClose={() => {
          setCurrencySelectVisible(false)
        }}
        updateCurrencyLimitsAtom={updateCurrencyLimitsAtom}
        visible={currencySelectVisible}
      />
    </Stack>
  )
}

export default CurrencyComponent
