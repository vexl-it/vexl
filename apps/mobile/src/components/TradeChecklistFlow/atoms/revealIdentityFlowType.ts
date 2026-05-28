import {type IdentityRevealStatus} from '../../../state/tradeChecklist/utils/getIdentityRevealStatus'

export type RevealIdentityFlowType = 'REQUEST_REVEAL' | 'RESPOND_REVEAL'

export function revealIdentityFlowTypeFromStatus(
  status: IdentityRevealStatus
): RevealIdentityFlowType {
  return status === 'theyAsked' ? 'RESPOND_REVEAL' : 'REQUEST_REVEAL'
}
