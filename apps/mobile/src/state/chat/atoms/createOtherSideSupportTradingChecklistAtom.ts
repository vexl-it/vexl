import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {
  compare,
  VersionString,
} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Schema} from 'effect/index'
import {atom, type Atom} from 'jotai'

const MINIMAL_VERSION_FOR_TRADING_CHECKLIST =
  Schema.decodeSync(VersionString)('1.13.1')

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
