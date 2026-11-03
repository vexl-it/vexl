import {InfoBox} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import {btcNetworkAtom} from '../../../atoms'

function NetworkInfo(): React.ReactElement {
  const {t} = useTranslation()
  const btcNetwork = useAtomValue(btcNetworkAtom)

  return (
    <InfoBox>
      {btcNetwork === 'LIGHTING'
        ? t('tradeChecklist.network.youWillGenerateQrCode')
        : t('tradeChecklist.network.itsOkIfYouDontHaveBtcAddressNow')}
    </InfoBox>
  )
}

export default NetworkInfo
