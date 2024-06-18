import {
  type CurrencyCode,
  type CurrencyInfo,
} from '@vexl-next/domain/src/general/currency.brand'
import {useAtomValue, type Atom} from 'jotai'
import {TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Image from '../../Image'
import checkmarkSvg from '../../images/checkmarkSvg'

interface Props {
  currencyAtom: Atom<CurrencyInfo>
  selectedCurrencyCodeAtom: Atom<CurrencyCode | undefined>
  onItemPress: (currency: CurrencyCode) => void
}

function CurrencySelectListItem({
  currencyAtom,
  selectedCurrencyCodeAtom,
  onItemPress,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()
  const currency = useAtomValue(currencyAtom)
  const selectedCurrencyCode = useAtomValue(selectedCurrencyCodeAtom)

  return (
    <TouchableOpacity
      onPress={() => {
        onItemPress(currency.code)
      }}
    >
      <XStack ai="center" jc="space-between">
        <Stack my="$2">
          <XStack ai="center">
            <Text ff="$body500" col="$greyAccent5" fos={18}>
              {`${currency.flag} ${t(`currency.${currency.code}`)}`}
            </Text>
          </XStack>
          <XStack ai="center" space="$1">
            <Text col="$greyAccent3">{currency.symbol}</Text>
            <Text col="$greyAccent3" fos={6}>
              ●
            </Text>
            <Text col="$greyAccent3">{currency.code}</Text>
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
