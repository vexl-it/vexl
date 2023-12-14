import {
  FooterButtonProxy,
  HeaderProxy,
} from '../../../../../PageWithNavigationHeader'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import Content from '../../../Content'
import {Stack} from 'tamagui'
import networkSvg from '../../../../../images/networkSvg'
import SectionTitle from './components/SectionTitle'
import BtcAddress from './components/BtcAddress'
import NetworkInfo from './components/NetworkInfo'
import {
  btcAddressAtom,
  btcNetworkAtom,
  saveLocalNetworkStateToMainStateActionAtom,
} from '../../atoms'
import {useSetAtom} from 'jotai'
import {type TradeChecklistStackScreenProps} from '../../../../../../navigationTypes'
import LightningOrOnChain from './components/LightningOrOnChain'
import {useEffect} from 'react'

type Props = TradeChecklistStackScreenProps<'Network'>

function NetworkScreen({
  navigation,
  route: {
    params: {networkData},
  },
}: Props): JSX.Element {
  const {btcAddress, btcNetwork} = networkData
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const saveLocalNetworkStateToMainState = useSetAtom(
    saveLocalNetworkStateToMainStateActionAtom
  )
  const setBtcNetwork = useSetAtom(btcNetworkAtom)
  const setBtcAddress = useSetAtom(btcAddressAtom)

  useEffect(() => {
    setBtcNetwork(btcNetwork ?? 'LIGHTING')
    setBtcAddress(btcAddress)
  }, [btcAddress, btcNetwork, setBtcAddress, setBtcNetwork])

  return (
    <>
      <HeaderProxy
        onClose={goBack}
        title={t('tradeChecklist.network.network')}
      />
      <Content scrollable>
        <SectionTitle
          text={t('tradeChecklist.network.network')}
          icon={networkSvg}
          mt={'$4'}
        />
        <Stack space={'$6'}>
          <LightningOrOnChain />
          <BtcAddress />
        </Stack>
      </Content>
      <NetworkInfo />
      <FooterButtonProxy
        onPress={() => {
          saveLocalNetworkStateToMainState()
          navigation.navigate('AgreeOnTradeDetails')
        }}
        text={t('common.confirm')}
      />
    </>
  )
}

export default NetworkScreen
