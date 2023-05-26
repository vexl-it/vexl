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

type LogsShareError = BasicError<'LogsShareError'>

export default function saveLogsToDirectoryAndShare(): TE.TaskEither<
  LogsShareError,
  true
> {
  return TE.tryCatch(
    async () => {
      if (!FileSystem.documentDirectory) throw new Error('oj')
      const logsUri = joinUrl(
        FileSystem.documentDirectory,
        `vexl${version}-logs.txt`
      )

      if ((await FileSystem.getInfoAsync(logsUri)).exists) {
        await FileSystem.deleteAsync(logsUri)
      }

      await FileSystem.writeAsStringAsync(logsUri, readLogsRaw(), {
        encoding: 'utf8',
      })

      await Sharing.shareAsync(logsUri)
      return true as const
    },
    (e) => {
      console.log(e)
      return toBasicError('LogsShareError')(e)
    }
  )
}
