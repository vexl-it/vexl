import {Stack} from 'tamagui'
import Info from '../../../../../../Info'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import {useAtomValue} from 'jotai'
import {btcNetworkAtom} from '../../../atoms'

function NetworkInfo(): JSX.Element {
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
