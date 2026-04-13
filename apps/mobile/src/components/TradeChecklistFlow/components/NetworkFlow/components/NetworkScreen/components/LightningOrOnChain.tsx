import {RowRadiobutton} from '@vexl-next/ui'
import {useAtom} from 'jotai'
import React, {useCallback} from 'react'
import {RadioGroup, YStack} from 'tamagui'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import {btcNetworkAtom} from '../../../atoms'

function LightningOrOnChain(): React.ReactElement {
  const {t} = useTranslation()
  const [btcNetwork, setBtcNetwork] = useAtom(btcNetworkAtom)
  const onValueChange = useCallback(
    (value: string) => {
      if (value === 'LIGHTING' || value === 'ON_CHAIN') {
        setBtcNetwork(value)
      }
    },
    [setBtcNetwork]
  )

  return (
    <YStack gap="$4">
      <RadioGroup value={btcNetwork} onValueChange={onValueChange} gap="$2">
        <RowRadiobutton
          value="LIGHTING"
          selected={btcNetwork === 'LIGHTING'}
          label={t('tradeChecklist.network.lightning')}
          description={t('tradeChecklist.network.bestOptionForSmallAmounts')}
        />
        <RowRadiobutton
          value="ON_CHAIN"
          selected={btcNetwork === 'ON_CHAIN'}
          label={t('tradeChecklist.network.onChain')}
          description={t('tradeChecklist.network.bestOptionForHugeAmounts')}
        />
      </RadioGroup>
    </YStack>
  )
}

export default LightningOrOnChain
