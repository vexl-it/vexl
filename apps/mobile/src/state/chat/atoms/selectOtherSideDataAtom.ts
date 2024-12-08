import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import avatarsGoldenGlassesAndBackgroundSvg from '../../../components/AnonymousAvatar/images/avatarsGoldenGlassesAndBackgroundSvg'
import avatarsSvg from '../../../components/AnonymousAvatar/images/avatarsSvg'
import randomName from '../../../utils/randomName'
import {randomNumberFromSeed} from '../../../utils/randomNumber'

export default function selectOtherSideDataAtom(
  chatAtom: Atom<Chat>
): Atom<RealLifeInfo> {
  return selectAtom(chatAtom, getOtherSideData)
}

export function generateOtherSideSeed(chat: Chat): string {
  return chat.otherSide.publicKey + chat.inbox.privateKey.publicKeyPemBase64
}

export function getOtherSideData(chat: Chat): RealLifeInfo {
  const seed = generateOtherSideSeed(chat)
  const goldenAvatarType =
    chat.origin.type === 'theirOffer'
      ? chat.origin.offer?.offerInfo.publicPart.goldenAvatarType
      : undefined
  const avatars =
    goldenAvatarType === 'BACKGROUND_AND_GLASSES'
      ? avatarsGoldenGlassesAndBackgroundSvg
      : avatarsSvg
  const image = avatars[randomNumberFromSeed(0, avatars.length - 1, seed)]

  return {
    userName: chat.otherSide.realLifeInfo?.userName ?? randomName(seed),
    // @ts-expect-error TODO: typescript error
    image: chat.otherSide.realLifeInfo?.image ?? {
      type: 'svgXml',
      svgXml: image,
    },
    partialPhoneNumber: chat.otherSide.realLifeInfo?.partialPhoneNumber,
    fullPhoneNumber: chat.otherSide.realLifeInfo?.fullPhoneNumber,
  } as const
}
