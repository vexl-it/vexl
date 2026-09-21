import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {
  compare,
  type VersionString,
} from '@vexl-next/domain/src/utility/VersionString.brand'
import {atom, type Atom} from 'jotai'

export function createOtherSideVersionIsAtLeastAtom(
  chatAtom: Atom<Chat>,
  minimalVersion: VersionString
): Atom<boolean> {
  return atom((get) => {
    const otherSideVersion = get(chatAtom).otherSideVersion
    if (!otherSideVersion) return false
    return compare(otherSideVersion)('>=', minimalVersion)
  })
}
