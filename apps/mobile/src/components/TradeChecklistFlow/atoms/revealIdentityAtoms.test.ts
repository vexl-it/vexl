import {type IdentityRevealStatus} from '../../../state/tradeChecklist/utils/getIdentityRevealStatus'
import {revealIdentityFlowTypeFromStatus} from './revealIdentityFlowType'

const requestFlowStatuses: readonly IdentityRevealStatus[] = [
  'notStarted',
  'iAsked',
  'denied',
  'shared',
]

it('responds to a newer incoming identity request even after an older sent request was denied', () => {
  expect(revealIdentityFlowTypeFromStatus('theyAsked')).toBe('RESPOND_REVEAL')
})

it.each(requestFlowStatuses)(
  'starts a request for %s identity reveal status',
  (status) => {
    expect(revealIdentityFlowTypeFromStatus(status)).toBe('REQUEST_REVEAL')
  }
)
