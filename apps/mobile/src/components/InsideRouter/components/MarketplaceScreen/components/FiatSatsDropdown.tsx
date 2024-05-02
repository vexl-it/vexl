import {atom, useAtom, useAtomValue} from 'jotai'
import React from 'react'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import {type FiatOrSats} from '../../../../../state/marketplace/domain'
import {
  translationAtom,
  useTranslation,
} from '../../../../../utils/localization/I18nProvider'
import {marketplaceFiatOrSatsCurrencyAtom} from '../../../../../utils/preferences'
import {Dropdown, type DropdownItemProps} from '../../../../Dropdown'

const fiatOrSatsDropdownDataAtom = atom<Array<DropdownItemProps<FiatOrSats>>>(
  (get) => {
    const {t} = get(translationAtom)

    return [
      {
        label: t('common.FIAT'),
        value: 'FIAT',
      },
      {
        label: t('common.SATS'),
        value: 'SATS',
      },
    ]
  }
)

function FiatSatsDropdown(): JSX.Element {
  const {t} = useTranslation()
  const fiatOrSatsDropdownData = useAtomValue(fiatOrSatsDropdownDataAtom)
  const [marketplaceFiatOrSatsCurrency, setMarketplaceFiatOrSatsCurrency] =
    useAtom(marketplaceFiatOrSatsCurrencyAtom)

  return (
    <XStack f={1} ai="center" space="$2">
      <Text ff="$body600" color="$greyOnBlack">
        {t('offer.priceIn')}
      </Text>
      <Stack f={1}>
        <Dropdown
          containerStyle={{
            backgroundColor: getTokens().color.grey.val,
            borderRadius: getTokens().radius[4].val,
            borderWidth: 0,
          }}
          selectedTextStyle={{
            color: getTokens().color.greyOnBlack.val,
            fontSize: 14,
            fontFamily: 'TTSatoshi600',
          }}
          data={fiatOrSatsDropdownData}
          onChange={(item) => {
            if (item.value) setMarketplaceFiatOrSatsCurrency(item.value)
          }}
          value={{
            value: marketplaceFiatOrSatsCurrency,
            label: t(`common.${marketplaceFiatOrSatsCurrency}`),
          }}
          size="small"
        />
      </Stack>
    </XStack>
  )
}

export default FiatSatsDropdown
