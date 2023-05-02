import {type Atom} from 'jotai'
import {type Chat} from '@vexl-next/domain/dist/general/messaging'
import {selectAtom} from 'jotai/utils'
import randomName from '../../../utils/randomName'
import {randomNumberFromSeed} from '../../../utils/randomNumber'
import avatarsSvg from '../../../components/AnonymousAvatar/images/avatarsSvg'
import {type UserNameAndAvatar} from '@vexl-next/domain/dist/general/UserNameAndAvatar.brand'

export default function selectOtherSideDataAtom(
  chatAtom: Atom<Chat>
): Atom<UserNameAndAvatar> {
  return selectAtom(chatAtom, (chat) => {
    if (chat.otherSide.realLifeInfo) return chat.otherSide.realLifeInfo

    const seed =
      chat.origin.type === 'theirOffer' ? chat.origin.offerId : chat.id

    const image =
      avatarsSvg[randomNumberFromSeed(0, avatarsSvg.length - 1, seed)]

    return {
      userName: randomName(seed),
      image: {type: 'svgXml', svgXml: image},
    } as UserNameAndAvatar
  })
}
