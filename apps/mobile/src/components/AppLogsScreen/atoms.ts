import {atom} from 'jotai'
import {selectAtom, splitAtom} from 'jotai/utils'
import {listenOnAppLogs, readLogs} from './utils/storage'

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

export default appLogsAtom
