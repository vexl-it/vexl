import {
  toBasicError,
  type BasicError,
} from '@vexl-next/domain/src/utility/errors'
import {File, Paths} from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import * as TE from 'fp-ts/TaskEither'
import joinUrl from 'url-join'
import {version} from '../../../utils/environment'
import removeSensitiveData from '../../../utils/removeSensitiveData'
import {readLogsRaw} from './storage'

type LogsShareError = BasicError<'LogsShareError'>

export default function saveLogsToDirectoryAndShare(
  anonymize: boolean
): TE.TaskEither<LogsShareError, true> {
  return TE.tryCatch(
    async () => {
      if (!Paths.document) throw new Error('oj')
      const logsUri = joinUrl(
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
    (e) => {
      return toBasicError('LogsShareError')(e)
    }
  )
}
