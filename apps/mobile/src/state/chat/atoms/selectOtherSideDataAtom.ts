import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {type Atom} from 'jotai'
import {selectAtom} from 'jotai/utils'
import avatarsSvg from '../../../components/AnonymousAvatar/images/avatarsSvg'
import randomName from '../../../utils/randomName'
import {randomNumberFromSeed} from '../../../utils/randomNumber'

export default function selectOtherSideDataAtom(
  chatAtom: Atom<Chat>
): Atom<RealLifeInfo> {
  return selectAtom(chatAtom, (chat) => {
    return getOtherSideData(chat)
  })
}

export function getOtherSideData(chat: Chat): RealLifeInfo {
  const seed = chat.otherSide.publicKey
  const image = avatarsSvg[randomNumberFromSeed(0, avatarsSvg.length - 1, seed)]

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
