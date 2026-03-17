import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {atom} from 'jotai'

export const commonFriendsModalDataAtom = atom<
  readonly HashedPhoneNumber[] | null
>(null)
