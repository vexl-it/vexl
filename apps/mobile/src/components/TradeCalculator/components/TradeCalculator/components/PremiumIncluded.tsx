import {Typography} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {Stack} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {feeAmountAtom} from '../../../atoms'

function PremiumIncluded(): React.ReactElement | null {
  const {t} = useTranslation()
  const feeAmount = useAtomValue(feeAmountAtom)

  return feeAmount !== 0 ? (
    <Stack ai="flex-end" marginTop="$2">
      <Typography variant="micro" color="$foregroundSecondary">
        {`* ${t('tradeChecklist.calculateAmount.premiumIncluded', {
          value: `${feeAmount > 0 ? '+' : feeAmount < 0 ? '-' : ''} ${Math.abs(
            feeAmount
          )} %`,
        })}`}
      </Typography>
    </Stack>
  ) : null
}

export default PremiumIncluded
