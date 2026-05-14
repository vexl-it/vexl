import {atom} from 'jotai'
import {selectAtom, splitAtom} from 'jotai/utils'
import type {SetStateAction} from 'react'
import {setupAppLogs} from './utils/setupAppLogs'
import {
  getCustomLoggingEnabled,
  listenOnAppLogs,
  readLogs,
  setCustomLoggingEnabled,
} from './utils/storage'

const appLogsAtom = atom<string[]>([])
appLogsAtom.onMount = (setAtom) => {
  setAtom(readLogs())

  return listenOnAppLogs(setAtom)
}

export const appLogAtomsAtom = splitAtom(appLogsAtom)
export const appLogsEmptyAtom = selectAtom(
  appLogAtomsAtom,
  (logs) => logs.length === 0
)

const appLogsEnabledBaseAtom = atom(getCustomLoggingEnabled())

function resolveNextCustomLoggingEnabledValue(
  currentValue: boolean,
  nextValue: SetStateAction<boolean>
): boolean {
  if (typeof nextValue === 'function') return nextValue(currentValue)

  return nextValue
}

export const appLogsEnabledAtom = atom(
  (get) => get(appLogsEnabledBaseAtom),
  (get, set, nextValue: SetStateAction<boolean>) => {
    const resolvedNextValue = resolveNextCustomLoggingEnabledValue(
      get(appLogsEnabledBaseAtom),
      nextValue
    )

    set(appLogsEnabledBaseAtom, resolvedNextValue)
    setCustomLoggingEnabled(resolvedNextValue)
    setupAppLogs()
  }
)

export default appLogsAtom
