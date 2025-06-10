import Clipboard from '@react-native-clipboard/clipboard'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {getTokens} from 'tamagui'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import * as network from '../../../../../state/tradeChecklist/utils/network'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import copySvg from '../../../../images/copySvg'
import {toastNotificationAtom} from '../../../../ToastNotification/atom'
import {chatMolecule} from '../../../atoms'
import checkIconSvg from '../../images/checkIconSvg'
import VexlbotBubble from './VexlbotBubble'

interface Props {
  message: ChatMessageWithState
}

function TradeChecklistNetworkView({message}: Props): JSX.Element | null {
  const {t} = useTranslation()
  const {otherSideDataAtom, tradeChecklistNetworkAtom} =
    useMolecule(chatMolecule)
  const networkData = useAtomValue(tradeChecklistNetworkAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const latestNetworkDataMessage = network.getNetworkData(networkData)
  const setToastNotification = useSetAtom(toastNotificationAtom)

  if (!latestNetworkDataMessage) return null

  if (
    (message.state === 'sent' || message.state === 'received') &&
    message.message.messageType === 'TRADE_CHECKLIST_UPDATE' &&
    message.message.tradeChecklistUpdate?.network
  ) {
    const isMessageOutdated =
      message.message.tradeChecklistUpdate.network.timestamp !==
      latestNetworkDataMessage?.networkData.timestamp

    return (
      <VexlbotBubble
        messageState={message.state}
        username={otherSideData.userName}
        status={
          isMessageOutdated ? ('outdated' as const) : ('noStatus' as const)
        }
        text={
          message.message.tradeChecklistUpdate.network.btcNetwork === 'LIGHTING'
            ? t(
                message.state === 'sent'
                  ? 'vexlbot.setNetworkToLightningByMe'
                  : 'vexlbot.setNetworkToLightningByThem',
                {
                  username: otherSideData.userName,
                }
              )
            : message.message.tradeChecklistUpdate.network.btcAddress
              ? t('vexlbot.setNetworkToOnChainWithBtcAddress', {
                  btcAddress:
                    message.message.tradeChecklistUpdate.network.btcAddress,
                  username:
                    message.state === 'sent'
                      ? t('common.you')
                      : otherSideData.userName,
                })
              : `${t('vexlbot.setNetworkToOnChainNoBtcAddress', {
                  username:
                    message.state === 'sent'
                      ? `${t('common.you')}`
                      : otherSideData.userName,
                })} ${
                  message.state === 'sent'
                    ? t('vexlbot.dontForgetToGenerateAddress')
                    : t('vexlbot.btcAddressWillBeProvided')
                }`
        }
      >
        {message.message.tradeChecklistUpdate.network.btcNetwork ===
          'ON_CHAIN' &&
          !!message.message.tradeChecklistUpdate.network.btcAddress && (
            <Button
              onPress={() => {
                Clipboard.setString(
                  message.message.tradeChecklistUpdate?.network?.btcAddress ??
                    ''
                )
                setToastNotification({
                  visible: true,
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

  return null
}

export default TradeChecklistNetworkView
