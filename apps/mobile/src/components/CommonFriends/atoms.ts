import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {atom} from 'jotai'

export interface CommonFriendsModalData {
  readonly contactsHashes: readonly HashedPhoneNumber[]
  readonly verifiedHashes?: readonly HashedPhoneNumber[]
}

export const commonFriendsModalDataAtom = atom<CommonFriendsModalData | null>(
  null
)
