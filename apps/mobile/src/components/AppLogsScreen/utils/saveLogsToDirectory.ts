import * as TE from 'fp-ts/TaskEither'
import * as FileSystem from 'expo-file-system'
import joinUrl from 'url-join'
import * as Sharing from 'expo-sharing'
import {
  type BasicError,
  toBasicError,
} from '@vexl-next/domain/dist/utility/errors'
import {readLogsRaw} from './storage'
import {version} from '../../../utils/environment'
import removeSensitiveData from '../../../utils/removeSensitiveData'

type LogsShareError = BasicError<'LogsShareError'>

export default function saveLogsToDirectoryAndShare(
  anonymize: boolean
): TE.TaskEither<LogsShareError, true> {
  return TE.tryCatch(
    async () => {
      if (!FileSystem.documentDirectory) throw new Error('oj')
      const logsUri = joinUrl(
        FileSystem.documentDirectory,
        `vexl${version.replace(/ /g, '_')}-logs.txt`
      )

      if ((await FileSystem.getInfoAsync(logsUri)).exists) {
        await FileSystem.deleteAsync(logsUri)
      }

      const logsToExport = (() => {
        const logs = readLogsRaw()
        if (anonymize) {
          return removeSensitiveData(logs)
        }
        return logs
      })()

      await FileSystem.writeAsStringAsync(logsUri, logsToExport, {
        encoding: 'utf8',
      })

      await Sharing.shareAsync(logsUri)
      return true as const
    },
    (e) => {
      return toBasicError('LogsShareError')(e)
    }
  )
}
