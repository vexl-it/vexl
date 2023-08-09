import {
  type PrimitiveAtom,
  useAtomValue,
  useSetAtom,
  type WritableAtom,
} from 'jotai'
import {type CurrencyCode} from '@vexl-next/domain/src/general/offers'
import {useState} from 'react'
import {TouchableOpacity} from 'react-native'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import {currencies} from '../../../../utils/localization/currency'
import Image from '../../../Image'
import chevronDownSvg from '../../../../images/chevronDownSvg'
import CurrencySelect from '../../../CurrencySelect'
import clearInputSvg from '../../../images/clearInputSvg'

interface Props {
  currencyAtom: PrimitiveAtom<CurrencyCode | undefined>
  updateCurrencyLimitsAtom: WritableAtom<
    null,
    [
      {
        currency: CurrencyCode | undefined
      }
    ],
    boolean
  >
}

function CurrencyComponent({
  currencyAtom,
  updateCurrencyLimitsAtom,
}: Props): JSX.Element {
  const tokens = getTokens()
  const currency = useAtomValue(currencyAtom)
  const updateCurrencyLimits = useSetAtom(updateCurrencyLimitsAtom)

  const [currencySelectVisible, setCurrencySelectVisible] =
    useState<boolean>(false)

  return (
    <>
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
                Choose currency
              </Text>
            </Stack>
          )}
          <XStack>
            {currency && (
              <Stack mr={'$2'}>
                <TouchableOpacity
                  onPress={() => {
                    updateCurrencyLimits({currency: undefined})
                  }}
                >
                  <Image
                    stroke={tokens.color.main.val}
                    source={clearInputSvg}
                  />
                </TouchableOpacity>
              </Stack>
            )}
            <Image
              stroke={tokens.color.greyOnBlack.val}
              source={chevronDownSvg}
            />
          </XStack>
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
    </>
  )
}

export default CurrencyComponent
