import Clipboard from '@react-native-clipboard/clipboard'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {getTokens} from 'tamagui'
import * as network from '../../../../../state/tradeChecklist/utils/network'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import {toastNotificationAtom} from '../../../../ToastNotification/atom'
import {chatMolecule} from '../../../atoms'
import copySvg from '../../../images/copySvg'
import checkIconSvg from '../../images/checkIconSvg'
import VexlbotBubble from './VexlbotBubble'

function TradeChecklistNetworkView(): JSX.Element | null {
  const {t} = useTranslation()
  const {otherSideDataAtom, tradeChecklistNetworkAtom} =
    useMolecule(chatMolecule)
  const networkData = useAtomValue(tradeChecklistNetworkAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const networkDataToDisplay = network.getNetworkData(networkData)
  const setToastNotification = useSetAtom(toastNotificationAtom)

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
        !!networkDataToDisplay.networkData.btcAddress && (
          <Button
            onPress={() => {
              Clipboard.setString(
                networkDataToDisplay.networkData.btcAddress ?? ''
              )
              setToastNotification({
                text: t('common.copied'),
                icon: checkIconSvg,
              })
            }}
            beforeIcon={copySvg}
            text={t('vexlbot.btcAddress')}
            size="small"
            variant="primary"
            iconFill={getTokens().color.main.val}
          />
        )}
    </VexlbotBubble>
  )
}

export default TradeChecklistNetworkView
