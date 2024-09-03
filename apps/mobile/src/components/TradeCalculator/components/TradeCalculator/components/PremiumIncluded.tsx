import {useAtomValue} from 'jotai'
import {Stack, Text} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {feeAmountAtom} from '../../../atoms'

function PremiumIncluded(): JSX.Element | null {
  const {t} = useTranslation()
  const feeAmount = useAtomValue(feeAmountAtom)

  return feeAmount !== 0 ? (
    <Stack ai="flex-end" marginTop="$2">
      <Text fos={12} ff="$body500" col="$greyOnBlack">
        {`* ${t('tradeChecklist.calculateAmount.premiumIncluded', {
          value: `${feeAmount > 0 ? '+' : feeAmount < 0 ? '-' : ''} ${Math.abs(
            feeAmount
          )} %`,
        })}`}
      </Text>
    </Stack>
  ) : null
}

export default PremiumIncluded
