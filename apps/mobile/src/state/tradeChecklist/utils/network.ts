import {type NetworkData} from '@vexl-next/domain/src/general/tradeChecklist'
import {type TradeChecklistInState} from '../domain'

type NetworkInState = TradeChecklistInState['network']

export function getNetworkData(data: NetworkInState):
  | {
      by: 'me' | 'them'
      networkData: NetworkData
    }
  | undefined {
  const sentNetworkData = data.sent
  const receivedNetworkData = data.received

  if (sentNetworkData) {
    return {by: 'me', networkData: sentNetworkData}
  }

  if (receivedNetworkData) {
    return {by: 'them', networkData: receivedNetworkData}
  }

  return undefined
}

export function networkSettled(data: NetworkInState): boolean {
  return !!getNetworkData(data)
}
