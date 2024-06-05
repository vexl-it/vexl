import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {Stack, Text} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {tradeCalculatorMolecule} from '../atoms'

function PremiumIncluded(): JSX.Element | null {
  const {t} = useTranslation()
  const {feeAmountAtom} = useMolecule(tradeCalculatorMolecule)
  const feeAmount = useAtomValue(feeAmountAtom)

  return feeAmount !== 0 ? (
    <Stack ai="flex-end">
      <Text fos={12} ff="$body500" col="$greyOnBlack">
        {t('tradeChecklist.calculateAmount.premiumIncluded', {
          value: `${feeAmount > 0 ? '+' : feeAmount < 0 ? '-' : ''} ${Math.abs(
            feeAmount
          )} %`,
        })}
      </Text>
    </Stack>
  ) : null
}

export default PremiumIncluded
