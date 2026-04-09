import {BtcNetwork} from '@vexl-next/domain/src/general/offers'
import {RadioGroup, RowRadiobutton} from '@vexl-next/ui'
import {YStack} from '@vexl-next/ui/src/primitives'
import {Array, Option, pipe} from 'effect'
import {useAtom} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {updateBtcNetworkAtom} from '../atom'

function NetworkSection(): React.ReactElement {
  const {t} = useTranslation()
  const [btcNetwork, setBtcNetwork] = useAtom(updateBtcNetworkAtom)

  const currentValue = pipe(btcNetwork ?? [], Array.head, Option.getOrUndefined)

  return (
    <RadioGroup
      allowedValues={BtcNetwork.literals}
      value={currentValue}
      onValueChange={setBtcNetwork}
    >
      <YStack gap="$3">
        <RowRadiobutton
          value="LIGHTING"
          label={t('offerForm.network.lightning')}
          description={t('offerForm.network.theBestOption')}
        />
        <RowRadiobutton
          value="ON_CHAIN"
          label={t('offerForm.network.onChain')}
          description={t('offerForm.network.theBestFor')}
        />
      </YStack>
    </RadioGroup>
  )
}

export default NetworkSection
