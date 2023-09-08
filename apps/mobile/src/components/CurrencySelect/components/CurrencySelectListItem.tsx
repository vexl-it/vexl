import {getTokens, Stack, Text, XStack} from 'tamagui'
import {
  type CurrencyCode,
  type CurrencyInfo,
} from '@vexl-next/domain/dist/general/currency.brand'
import {TouchableOpacity} from 'react-native'
import Image from '../../Image'
import checkmarkSvg from '../../images/checkmarkSvg'
import {type Atom, type WritableAtom, useAtomValue, useSetAtom} from 'jotai'

interface Props {
  currencyAtom: Atom<CurrencyInfo>
  selectedCurrencyCodeAtom: Atom<CurrencyCode | undefined>
  onItemPress: () => void
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

function CurrencySelectListItem({
  currencyAtom,
  selectedCurrencyCodeAtom,
  onItemPress,
  updateCurrencyLimitsAtom,
}: Props): JSX.Element {
  const tokens = getTokens()
  const currency = useAtomValue(currencyAtom)
  const selectedCurrencyCode = useAtomValue(selectedCurrencyCodeAtom)
  const updateCurrencyLimits = useSetAtom(updateCurrencyLimitsAtom)

  return (
    <TouchableOpacity
      onPress={() => {
        updateCurrencyLimits({currency: currency.code})
        onItemPress()
      }}
    >
      <XStack ai={'center'} jc={'space-between'}>
        <Stack my={'$2'}>
          <XStack ai={'center'}>
            <Text ff={'$body500'} col={'$greyAccent5'} fos={18}>
              {`${currency.flag} ${currency.name}`}
            </Text>
          </XStack>
          <XStack ai={'center'} space={'$1'}>
            <Text col={'$greyAccent3'}>{currency.symbol}</Text>
            <Text col={'$greyAccent3'} fos={6}>
              {'●'}
            </Text>
            <Text col={'$greyAccent3'}>{currency.code}</Text>
          </XStack>
        </Stack>
        {selectedCurrencyCode === currency.code && (
          <Image
            height={24}
            width={24}
            source={checkmarkSvg}
            stroke={tokens.color.$greyAccent5.val}
          />
        )}
      </XStack>
    </TouchableOpacity>
  )
}

export default CurrencySelectListItem
