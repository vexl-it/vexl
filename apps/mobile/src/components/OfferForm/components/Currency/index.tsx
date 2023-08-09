import {type PrimitiveAtom, useAtomValue, type WritableAtom} from 'jotai'
import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {XStack, Text, getTokens, Stack} from 'tamagui'
import {TouchableOpacity} from 'react-native'
import {currencies} from '../../../../utils/localization/currency'
import Image from '../../../Image'
import chevronDownSvg from '../../../../images/chevronDownSvg'
import {useState} from 'react'
import CurrencySelect from '../../../CurrencySelect'
import {useTranslation} from '../../../../utils/localization/I18nProvider'

interface Props {
  currencyAtom: PrimitiveAtom<CurrencyCode>
  updateCurrencyLimitsAtom: WritableAtom<
    null,
    [
      {
        currency: CurrencyCode
      }
    ],
    boolean
  >
}

function CurrencyComponent({
  currencyAtom,
  updateCurrencyLimitsAtom,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()
  const currency = useAtomValue(currencyAtom)

  const [currencySelectVisible, setCurrencySelectVisible] =
    useState<boolean>(false)

  return (
    <Stack>
      <Text ff="$body600" fos={16} col="$greyOnBlack" mb="$4">
        {t('offerForm.currencyYouWouldLikeToUse')}
      </Text>
      <TouchableOpacity
        onPress={() => {
          setCurrencySelectVisible(true)
        }}
      >
        <XStack
          ai={'center'}
          jc={'space-between'}
          px={'$5'}
          py={'$4'}
          br={'$5'}
          bc={'$grey'}
        >
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
          <Image
            stroke={tokens.color.greyOnBlack.val}
            source={chevronDownSvg}
          />
        </XStack>
      </TouchableOpacity>
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
