import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../../../atoms'
import {useAtomValue} from 'jotai'
import * as network from '../../../../../state/tradeChecklist/utils/network'
import VexlbotBubble from './VexlbotBubble'
import Button from '../../../../Button'
import Clipboard from '@react-native-clipboard/clipboard'
import copySvg from '../../../images/copySvg'
import {getTokens} from 'tamagui'

function TradeChecklistNetworkView(): JSX.Element | null {
  const {t} = useTranslation()
  const {otherSideDataAtom, tradeChecklistNetworkAtom} =
    useMolecule(chatMolecule)
  const networkData = useAtomValue(tradeChecklistNetworkAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const networkDataToDisplay = network.getNetworkData(networkData)

  if (!networkDataToDisplay) return null

  return (
    <VexlbotBubble
      text={
        networkDataToDisplay.networkData.btcNetwork === 'LIGHTING'
          ? t(
              networkDataToDisplay.by === 'me'
                ? 'vexlbot.setNetworkToLightningByMe'
                : 'vexlbot.setNetworkToLightningByThem',
              {
                username: otherSideData.userName,
              }
            )
          : networkDataToDisplay.networkData.btcAddress
          ? t('vexlbot.setNetworkToOnChainWithBtcAddress', {
              btcAddress: networkDataToDisplay.networkData.btcAddress,
              username:
                networkDataToDisplay.by === 'me'
                  ? t('common.you')
                  : otherSideData.userName,
            })
          : `${t('vexlbot.setNetworkToOnChainNoBtcAddress', {
              username:
                networkDataToDisplay.by === 'me'
                  ? `${t('common.you')}`
                  : otherSideData.userName,
            })} ${
              networkDataToDisplay.by === 'me'
                ? t('vexlbot.dontForgetToGenerateAddress')
                : t('vexlbot.btcAddressWillBeProvided')
            }`
      }
    >
      {networkDataToDisplay.networkData.btcNetwork === 'ON_CHAIN' &&
        networkDataToDisplay.networkData.btcAddress && (
          <Button
            onPress={() => {
              Clipboard.setString(
                networkDataToDisplay.networkData.btcAddress ?? ''
              )
            }}
            beforeIcon={copySvg}
            text={t('vexlbot.btcAddress')}
            size={'small'}
            variant={'primary'}
            iconFill={getTokens().color.main.val}
          />
        )}
    </VexlbotBubble>
  )
}

export default TradeChecklistNetworkView
