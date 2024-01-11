import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {type ContactReveal} from '@vexl-next/domain/src/general/tradeChecklist'

export default function processTradeChecklistContactRevealMessageIfAny(
  contactRevealData: ContactReveal | undefined,
  realLifeInfo: RealLifeInfo | undefined
): RealLifeInfo | undefined {
  if (!realLifeInfo) return undefined

  return {
    ...realLifeInfo,
    fullPhoneNumber: contactRevealData?.fullPhoneNumber,
  }
}
