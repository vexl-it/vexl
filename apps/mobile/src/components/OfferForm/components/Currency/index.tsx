import {type PrimitiveAtom, useAtomValue, type WritableAtom} from 'jotai'
import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {XStack, Text, Stack} from 'tamagui'
import {currencies} from '../../../../utils/localization/currency'
import {useState} from 'react'
import CurrencySelect from '../../../CurrencySelect'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
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
}: Props): JSX.Element {
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
          <XStack ai={'center'} space={'$1'}>
            <Text ff={'$body600'} fos={18} col={'$main'}>
              {currencies[currency].symbol}
            </Text>
            <Text ff={'$body600'} fos={10} col={'$greyOnBlack'}>
              {'●'}
            </Text>
            <Text ff={'$body600'} fos={18} col={'$main'}>
              {currencies[currency].code}
            </Text>
          </XStack>
        ) : (
          <Stack>
            <Text ff={'$body'} fos={18} col={'$greyOnBlack'}>
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
