import {type Chat} from '@vexl-next/domain/src/general/messaging'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Schema} from 'effect/index'
import {type Atom} from 'jotai'
import {createOtherSideVersionIsAtLeastAtom} from './createOtherSideVersionIsAtLeastAtom'

const MINIMAL_VERSION_FOR_TRADING_CHECKLIST =
  Schema.decodeSync(VersionString)('1.13.1')

export function createOtherSideSupportsTradingChecklistAtom(
  chatAtom: Atom<Chat>
): Atom<boolean> {
  return createOtherSideVersionIsAtLeastAtom(
    chatAtom,
    MINIMAL_VERSION_FOR_TRADING_CHECKLIST
  )
}
