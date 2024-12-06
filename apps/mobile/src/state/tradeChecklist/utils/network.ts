import {type NetworkChatMessage} from '@vexl-next/domain/src/general/tradeChecklist'
import {type TradeChecklistInState} from '../domain'

type NetworkInState = TradeChecklistInState['network']

export function getNetworkData(data: NetworkInState):
  | {
      networkData: NetworkChatMessage
    }
  | undefined {
  const sentNetworkData = data.sent
  const receivedNetworkData = data.received

  if (sentNetworkData) {
    return {networkData: sentNetworkData}
  }

  if (receivedNetworkData) {
    return {networkData: receivedNetworkData}
  }

  return undefined
}

export function networkSettled(data: NetworkInState): boolean {
  return !!getNetworkData(data)
}
