import {type NetworkData} from '@vexl-next/domain/src/general/tradeChecklist'
import {UnixMilliseconds0} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
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
  const sentTimestamp = data.sent?.timestamp ?? UnixMilliseconds0
  const receivedTimestamp = data.received?.timestamp ?? UnixMilliseconds0

  if (sentTimestamp > receivedTimestamp && sentNetworkData) {
    return {by: 'me', networkData: sentNetworkData}
  }
  if (receivedTimestamp > sentTimestamp && receivedNetworkData) {
    return {by: 'them', networkData: receivedNetworkData}
  }

  return undefined
}
