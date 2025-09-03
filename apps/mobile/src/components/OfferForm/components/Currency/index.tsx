import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {
  atom,
  useAtomValue,
  useSetAtom,
  type PrimitiveAtom,
  type WritableAtom,
} from 'jotai'
import React from 'react'
import {Stack, Text, XStack} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {currencies} from '../../../../utils/localization/currency'
import CurrencySelect from '../../../CurrencySelect'
import DropdownSelectButton from '../../../DropdownSelectButton'

interface Props {
  currencyAtom: PrimitiveAtom<CurrencyCode | undefined>
  hideInFilter?: boolean
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

const currencySelectVisibleAtom = atom<boolean>(false)

function CurrencyComponent({
  currencyAtom,
  hideInFilter,
  updateCurrencyLimitsAtom,
}: Props): React.ReactElement | null {
  const {t} = useTranslation()
  const currency = useAtomValue(currencyAtom)
  const setCurrencySelectVisible = useSetAtom(currencySelectVisibleAtom)
  const updateCurrencyLimits = useSetAtom(updateCurrencyLimitsAtom)

  return (
    <Stack>
      {!hideInFilter && (
        <Text ff="$body500" fos={16} col="$white" mb="$4">
          {t('offerForm.currencyYouWouldLikeToUse')}
        </Text>
      )}
      <DropdownSelectButton
        onPress={() => {
          setCurrencySelectVisible(true)
        }}
      >
        {currency ? (
          <XStack ai="center" gap="$1">
            <Text ff="$body500" fos={18} col="$main">
              {currencies[currency].symbol}
            </Text>
            <Text ff="$body600" fos={10} col="$greyOnBlack">
              ●
            </Text>
            <Text ff="$body500" fos={18} col="$main">
              {currencies[currency].code}
            </Text>
          </XStack>
        ) : (
          <Stack>
            <Text ff="$body500" fos={18} col="$greyOnBlack">
              {t('filterOffers.chooseCurrency')}
            </Text>
          </Stack>
        )}
      </DropdownSelectButton>
      <CurrencySelect
        selectedCurrencyCodeAtom={currencyAtom}
        onItemPress={(currency) => {
          updateCurrencyLimits({currency})
        }}
        visibleAtom={currencySelectVisibleAtom}
      />
    </Stack>
  )
}

export default CurrencyComponent
