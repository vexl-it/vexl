import {useAtomValue} from 'jotai'
import {Text} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {tradePriceTypeAtom} from '../../../atoms'

function CalculatedWithLiveRate(): JSX.Element | null {
  const {t} = useTranslation()
  const tradePriceType = useAtomValue(tradePriceTypeAtom)

  return tradePriceType === 'live' ? (
    <Text fos={12} ff="$body500" col="$greyOnBlack">
      {t('tradeChecklist.calculateAmount.calculatedWithLiveRate')}
    </Text>
  ) : null
}

export default CalculatedWithLiveRate
