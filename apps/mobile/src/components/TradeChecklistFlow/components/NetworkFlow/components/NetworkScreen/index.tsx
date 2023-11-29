import {
  FooterButtonProxy,
  HeaderProxy,
} from '../../../../../PageWithNavigationHeader'
import useSafeGoBack from '../../../../../../utils/useSafeGoBack'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'
import Content from '../../../Content'
import {Stack} from 'tamagui'
import networkSvg from '../../../../../images/networkSvg'
import LightningCell from './components/LightningCell'
import OnChainCell from './components/OnChainCell'
import SectionTitle from './components/SectionTitle'
import BtcAddress from './components/BtcAddress'
import NetworkInfo from './components/NetworkInfo'
import {saveLocalNetworkStateToMainStateActionAtom} from '../../atoms'
import {useSetAtom} from 'jotai'

function NetworkScreen(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const saveLocalNetworkStateToMainState = useSetAtom(
    saveLocalNetworkStateToMainStateActionAtom
  )

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
        />
        <Stack space={'$6'}>
          <Stack space={'$2'}>
            <LightningCell />
            <OnChainCell />
          </Stack>
          <BtcAddress />
        </Stack>
      </Content>
      <NetworkInfo />
      <FooterButtonProxy
        onPress={saveLocalNetworkStateToMainState}
        text={t('common.confirm')}
      />
    </>
  )
}

export default NetworkScreen
