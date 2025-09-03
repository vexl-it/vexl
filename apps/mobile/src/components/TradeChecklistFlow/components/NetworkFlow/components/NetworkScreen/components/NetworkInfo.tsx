import {useAtomValue} from 'jotai'
import React from 'react'
import {Stack} from 'tamagui'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import Info from '../../../../../../Info'
import {btcNetworkAtom} from '../../../atoms'

function NetworkInfo(): React.ReactElement {
  const {t} = useTranslation()
  const btcNetwork = useAtomValue(btcNetworkAtom)

  return (
    <Stack mb="$4">
      <Info
        hideCloseButton
        variant="yellow"
        text={
          btcNetwork === 'LIGHTING'
            ? t('tradeChecklist.network.youWillGenerateQrCode')
            : t('tradeChecklist.network.itsOkIfYouDontHaveBtcAddressNow')
        }
      />
    </Stack>
  )
}

export default NetworkInfo
