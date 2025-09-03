import {
  type ChatMessageId,
  ChatMessageIdE,
} from '@vexl-next/domain/src/general/messaging'
import {
  UnixMillisecondsE,
  unixMillisecondsFromNow,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Array, Effect, pipe, Schema} from 'effect/index'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {apiAtom} from '../../../api'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'
import {reportErrorE} from '../../../utils/reportError'

// 2 DAYS
const RECORD_PRUNE_TIME_MILLISEC = 2 * 24 * 60 * 60 * 1000

const reportedMessagesStorage = atomWithParsedMmkvStorageE(
  'reportedMessagesStorage',
  {uuids: []},
  Schema.Struct({
    uuids: Schema.Array(
      Schema.Struct({
        uuid: ChatMessageIdE,
        reportedAt: UnixMillisecondsE,
      })
    ),
  })
)
const reportedMessagesAtom = focusAtom(reportedMessagesStorage, (p) =>
  p.prop('uuids')
)

export const reportMessagesReceivedActionAtom = atom(
  null,
  (get, set, messagesIds: ChatMessageId[]) => {
    return Effect.gen(function* (_) {
      const reportedMessages = get(reportedMessagesAtom)
      const firstTimeSeenIds = Array.difference(
        messagesIds,
        Array.map(reportedMessages, (o) => o.uuid)
      )

      console.info(
        `Reporting ChatMessageReceived. Reporting ${firstTimeSeenIds.length} messages out of ${messagesIds.length} due to some being already reported`
      )

      set(
        reportedMessagesAtom,
        pipe(
          reportedMessages,
          Array.union(
            Array.map(firstTimeSeenIds, (o) => ({
              uuid: o,
              reportedAt: unixMillisecondsNow(),
            }))
          ),
          Array.filter(
            (one) =>
              one.reportedAt <
              unixMillisecondsFromNow(RECORD_PRUNE_TIME_MILLISEC)
          )
        )
      )

      if (firstTimeSeenIds.length > 0)
        yield* _(
          get(apiAtom)
            .metrics.reportNotificationInteraction({
              count: firstTimeSeenIds.length,
              type: 'ChatMessageReceived',
              notificationType: 'Chat',
              uuid: generateUuid(),
            })
            .pipe(
              Effect.tapError((e) =>
                reportErrorE(
                  'warn',
                  new Error('Error while reporting chatMessageReceived', {
                    cause: e,
                  })
                )
              ),
              Effect.ignore,
              Effect.forkDaemon
            )
        )
    })
  }
)
