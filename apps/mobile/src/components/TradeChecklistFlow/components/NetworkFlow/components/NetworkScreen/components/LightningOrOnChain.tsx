import {BtcNetwork} from '@vexl-next/domain/src/general/offers'
import {RadioGroup, RowRadiobutton} from '@vexl-next/ui'
import {useAtom} from 'jotai'
import React from 'react'
import {YStack} from 'tamagui'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import {btcNetworkAtom} from '../../../atoms'

function LightningOrOnChain(): React.ReactElement {
  const {t} = useTranslation()
  const [btcNetwork, setBtcNetwork] = useAtom(btcNetworkAtom)

  return (
    <YStack gap="$4">
      <RadioGroup
        allowedValues={BtcNetwork.literals}
        value={btcNetwork}
        onValueChange={setBtcNetwork}
        gap="$2"
      >
        <RowRadiobutton
          value="LIGHTING"
          label={t('tradeChecklist.network.lightning')}
          description={t('tradeChecklist.network.bestOptionForSmallAmounts')}
        />
        <RowRadiobutton
          value="ON_CHAIN"
          label={t('tradeChecklist.network.onChain')}
          description={t('tradeChecklist.network.bestOptionForHugeAmounts')}
        />
      </RadioGroup>
    </YStack>
  )
}

export default LightningOrOnChain
