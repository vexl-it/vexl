import {
  toBasicError,
  type BasicError,
} from '@vexl-next/domain/src/utility/errors'
import {Effect} from 'effect'
import {File, Paths} from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import {version} from '../../../utils/environment'
import removeSensitiveData from '../../../utils/removeSensitiveData'
import {readLogsRaw} from './storage'

type LogsShareError = BasicError<'LogsShareError'>

export default function saveLogsToDirectoryAndShare(
  anonymize: boolean
): Effect.Effect<true, LogsShareError> {
  return Effect.tryPromise({
    try: async () => {
      if (!Paths.document) throw new Error('oj')
      const logsUri = Paths.join(
        Paths.document.uri,
        `vexl${version.replace(/ /g, '_')}-logs.txt`
      )

      const logsFile = new File(logsUri)

      if (logsFile.info().exists) {
        logsFile.delete()
      }

      const logsToExport = (() => {
        const logs = readLogsRaw()
        if (anonymize) {
          return removeSensitiveData(logs)
        }
        return logs
      })()

      logsFile.write(logsToExport, {encoding: 'utf8'})

      await Sharing.shareAsync(logsUri)
      return true as const
    },
    catch: (e) => {
      return toBasicError('LogsShareError')(e)
    },
  })
}
