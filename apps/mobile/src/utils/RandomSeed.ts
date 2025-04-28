import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {Schema} from 'effect'

export const RandomSeed = Schema.String.pipe(Schema.brand('RandomSeed'))
export type RandomSeed = typeof RandomSeed.Type

const brandRandomSeed = Schema.decodeSync(RandomSeed)

export function randomSeedFromOfferInfo(offerInfo: OfferInfo): RandomSeed {
  return brandRandomSeed(offerInfo.offerId)
}

export function randomSeedFromChat(chat: Chat): RandomSeed {
  if (chat.origin.type === 'theirOffer' && chat.origin.offer) {
    return brandRandomSeed(chat.origin.offer.offerInfo.offerId)
  }

  return brandRandomSeed(
    chat.otherSide.publicKey + chat.inbox.privateKey.publicKeyPemBase64
  )
}
