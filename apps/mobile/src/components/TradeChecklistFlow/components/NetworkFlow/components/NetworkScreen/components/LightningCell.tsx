import {type BtcNetwork} from '@vexl-next/domain/dist/general/offers'
import {useAtom} from 'jotai'
import {useTranslation} from '../../../../../../../utils/localization/I18nProvider'
import {btcNetworkAtom} from '../../../atoms'
import SelectableCell from '../../../../../../SelectableCell'

function LightningCell(): JSX.Element {
  const {t} = useTranslation()
  const [btcNetwork, setBtcNetwork] = useAtom(btcNetworkAtom)

  return (
    <SelectableCell<BtcNetwork>
      selected={btcNetwork === 'LIGHTING'}
      onPress={setBtcNetwork}
      title={t('tradeChecklist.network.lightning')}
      subtitle={t('tradeChecklist.network.bestOptionForSmallAmounts')}
      type={'LIGHTING'}
    />
  )
}

export default LightningCell
