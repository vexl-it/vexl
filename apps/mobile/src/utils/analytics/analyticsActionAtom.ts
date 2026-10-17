import {atom, type Getter, type Setter, type WritableAtom} from 'jotai'
import reportError from '../reportError'
import {analyticsEnabledAtom} from './atoms'

// Do not import effect's `Array` here: Babel compiles the rest parameters
// below to `new Array(...)`, which the import would shadow.
/**
 * Every analytics report goes through here: it does nothing while analytics is
 * off and never lets a failure reach the app flow that reports.
 */
export function analyticsActionAtom<Args extends unknown[]>(
  write: (get: Getter, set: Setter, ...args: Args) => void
): WritableAtom<null, Args, void> {
  return atom(null, (get, set, ...args: Args) => {
    if (!get(analyticsEnabledAtom)) return
    try {
      write(get, set, ...args)
    } catch (e) {
      reportError('warn', new Error('Analytics report failed', {cause: e}))
    }
  })
}
