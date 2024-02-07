import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {
  compare,
  SemverString,
} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {atom, type Atom} from 'jotai'

const MINIMAL_VERSION_FOR_TRADING_CHECKLIST = SemverString.parse('1.13.1')

export function createOtherSideSupportsTradingChecklistAtom(
  chatAtom: Atom<Chat>
): Atom<boolean> {
  return atom((get) => {
    const otherSideVersion = get(chatAtom).otherSideVersion
    if (!otherSideVersion) return false
    return compare(otherSideVersion)(
      '>=',
      MINIMAL_VERSION_FOR_TRADING_CHECKLIST
    )
  })
}
