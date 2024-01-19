import {Stack} from 'tamagui'
import SelectableCell from '../../../../../../SelectableCell'
import {type BtcNetwork} from '@vexl-next/domain/src/general/offers'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import {useAtom} from 'jotai'
import {btcNetworkAtom} from '../../../atoms'

function LightningOrOnChain(): JSX.Element {
  const {t} = useTranslation()
  const [btcNetwork, setBtcNetwork] = useAtom(btcNetworkAtom)

  return (
    <Stack space="$2">
      <SelectableCell<BtcNetwork>
        selected={btcNetwork === 'LIGHTING'}
        onPress={setBtcNetwork}
        title={t('tradeChecklist.network.lightning')}
        subtitle={t('tradeChecklist.network.bestOptionForSmallAmounts')}
        type="LIGHTING"
      />
      <SelectableCell<BtcNetwork>
        selected={btcNetwork === 'ON_CHAIN'}
        onPress={setBtcNetwork}
        title={t('tradeChecklist.network.onChain')}
        subtitle={t('tradeChecklist.network.bestOptionForHugeAmounts')}
        type="ON_CHAIN"
      />
    </Stack>
  )
}

export default LightningOrOnChain
