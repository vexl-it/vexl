import {InputHint, TextField, Typography} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {YStack} from 'tamagui'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import AnonymizationNotice from '../../../../AnonymizationNotice'
import {
  btcAddressInputAtom,
  btcNetworkAtom,
  displayParsingErrorAtom,
} from '../../../atoms'
import NetworkInfo from './NetworkInfo'

function BtcAddress(): React.ReactElement | null {
  const {t} = useTranslation()
  const btcNetwork = useAtomValue(btcNetworkAtom)
  const displayParsingError = useAtomValue(displayParsingErrorAtom)

  if (btcNetwork === 'LIGHTING') return null

  return (
    <YStack gap="$3">
      <Typography variant="paragraphSmall" color="$foregroundPrimary">
        {t('tradeChecklist.btcAddress.btcAddress')}
      </Typography>
      <TextField
        valueAtom={btcAddressInputAtom}
        placeholder={t('tradeChecklist.network.pasteBtcAddress')}
        showClear
      />
      {!!displayParsingError && (
        <InputHint variant="error">
          {t('tradeChecklist.network.invalidBtcAddress')}
        </InputHint>
      )}
      <AnonymizationNotice als="flex-start" mt="$1" mb="$0" />
      <NetworkInfo />
    </YStack>
  )
}

export default BtcAddress
