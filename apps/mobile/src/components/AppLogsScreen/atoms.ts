import {atom} from 'jotai'
import {listenOnAppLogs, readLogs} from './utils/storage'
import {splitAtom} from 'jotai/utils'

const appLogsAtom = atom<string[]>([])
appLogsAtom.onMount = (setAtom) => {
  setAtom(readLogs())

  return listenOnAppLogs(setAtom)
}

export const appLogAtomsAtom = splitAtom(appLogsAtom)

export default appLogsAtom
