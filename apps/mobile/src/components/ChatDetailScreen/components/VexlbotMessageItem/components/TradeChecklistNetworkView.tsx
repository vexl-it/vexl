import Clipboard from '@react-native-clipboard/clipboard'
import {useMolecule} from 'bunshi/dist/react'
import {Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {getTokens} from 'tamagui'
import {type ChatMessageWithState} from '../../../../../state/chat/domain'
import * as network from '../../../../../state/tradeChecklist/utils/network'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import copySvg from '../../../../images/copySvg'
import {toastNotificationAtom} from '../../../../ToastNotification/atom'
import {chatMolecule} from '../../../atoms'
import VexlbotActionCard from './VexlbotActionCard'
import VexlbotNextActionSuggestion from './VexlbotNextActionSuggestion'

interface Props {
  message: ChatMessageWithState
}

function TradeChecklistNetworkView({
  message,
}: Props): React.ReactElement | null {
  const {t} = useTranslation()
  const {
    otherSideDataAtom,
    tradeChecklistNetworkAtom,
    lastTradeChecklistMessageAtom,
  } = useMolecule(chatMolecule)
  const lastTradeChecklistMessage = useAtomValue(lastTradeChecklistMessageAtom)
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
    const description =
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

    return (
      <>
        <VexlbotActionCard
          description={description}
          statusLabel={isMessageOutdated ? t('common.outdated') : undefined}
          statusVariant="outdated"
          title={t('tradeChecklist.options.SET_NETWORK')}
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
                  setToastNotification(t('common.copied'))
                }}
                beforeIcon={copySvg}
                text={t('vexlbot.btcAddress')}
                size="small"
                variant="primary"
                iconFill={getTokens().color.main.val}
              />
            )}
        </VexlbotActionCard>
        {Option.isSome(lastTradeChecklistMessage) &&
          lastTradeChecklistMessage.value.message.uuid ===
            message.message.uuid && <VexlbotNextActionSuggestion />}
      </>
    )
  }

  return null
}

export default TradeChecklistNetworkView
