import {makeRepeatingTaskLayer} from '@vexl-next/server-utils/src/repeatingTask'
import {Effect, Layer} from 'effect'
import {
  cleanExpiredNotesIntervalMsConfig,
  cleanReportedRecordsIntervalMsConfig,
  reportLimitIntervalDaysConfig,
} from './configs'
import {NoteDbService} from './db/NoteDbService'
import {OfferDbService} from './db/OfferDbService'

const expiredNotesCleanupLayer = makeRepeatingTaskLayer({
  queueName: 'offer-service-clean-expired-notes',
  jobName: 'clean_expired_notes',
  intervalMs: cleanExpiredNotesIntervalMsConfig,
  lockResource: 'offerService:cleanExpiredNotes',
  lockDuration: '5 minutes',
  task: Effect.flatMap(NoteDbService, (noteDb) => noteDb.deleteExpiredNotes()),
})

const reportedRecordsCleanupLayer = makeRepeatingTaskLayer({
  queueName: 'offer-service-clean-reported-records',
  jobName: 'clean_reported_records',
  intervalMs: cleanReportedRecordsIntervalMsConfig,
  lockResource: 'offerService:cleanReportedRecords',
  lockDuration: '5 minutes',
  task: Effect.gen(function* (_) {
    const offerDb = yield* _(OfferDbService)
    const noteDb = yield* _(NoteDbService)
    const reportLimitIntervalDays = yield* _(reportLimitIntervalDaysConfig)
    yield* _(
      offerDb.deleteOfferReportedRecordByReportedAtBefore(
        reportLimitIntervalDays
      )
    )
    yield* _(
      noteDb.deleteNoteReportedRecordByReportedAtBefore(reportLimitIntervalDays)
    )
  }),
})

export const CleanupWorkersLayer = Layer.mergeAll(
  expiredNotesCleanupLayer,
  reportedRecordsCleanupLayer
)
