import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {type UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {type TFunction} from '../localization/I18nProvider'

export function getChatDisplayName({
  offerInfo,
  userName,
  t,
}: {
  offerInfo?: OfferInfo
  userName?: UserName
  t: TFunction
}): string | undefined {
  if (userName) return userName

  if (!offerInfo) return undefined

  if (offerInfo.privatePart.friendLevel.includes('SECOND_DEGREE'))
    return t('offer.friendOfFriend')
  if (offerInfo.privatePart.friendLevel.includes('FIRST_DEGREE'))
    return t('offer.directFriend')
  if (offerInfo.privatePart.friendLevel.includes('CLUB'))
    return t('offer.clubMember')

  return undefined
}
