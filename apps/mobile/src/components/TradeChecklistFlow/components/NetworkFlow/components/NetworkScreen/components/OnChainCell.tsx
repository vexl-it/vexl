import {type BtcNetwork} from '@vexl-next/domain/dist/general/offers'
import {useAtom} from 'jotai'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import {btcNetworkAtom} from '../../../atoms'
import SelectableCell from '../../../../../../SelectableCell'

function OnChainCell(): JSX.Element {
  const {t} = useTranslation()
  const [btcNetwork, setBtcNetwork] = useAtom(btcNetworkAtom)

  return (
    <SelectableCell<BtcNetwork>
      selected={btcNetwork === 'ON_CHAIN'}
      onPress={setBtcNetwork}
      title={t('tradeChecklist.network.onChain')}
      subtitle={t('tradeChecklist.network.bestOptionForHugeAmounts')}
      type={'ON_CHAIN'}
    />
  )
}

export default OnChainCell
