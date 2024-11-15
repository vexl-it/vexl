import {type BtcNetwork} from '@vexl-next/domain/src/general/offers'
import {useAtom} from 'jotai'
import {Stack} from 'tamagui'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import SelectableCell from '../../../../../../SelectableCell'
import {btcNetworkAtom} from '../../../atoms'

function LightningOrOnChain(): JSX.Element {
  const {t} = useTranslation()
  const [btcNetwork, setBtcNetwork] = useAtom(btcNetworkAtom)

  return (
    <Stack gap="$2">
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
