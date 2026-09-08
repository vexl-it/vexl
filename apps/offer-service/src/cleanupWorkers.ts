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
  task: Effect.gen(function* () {
    const offerDb = yield* OfferDbService
    const noteDb = yield* NoteDbService
    const reportLimitIntervalDays = yield* reportLimitIntervalDaysConfig
    yield* offerDb.deleteOfferReportedRecordByReportedAtBefore(
      reportLimitIntervalDays
    )
    yield* noteDb.deleteNoteReportedRecordByReportedAtBefore(
      reportLimitIntervalDays
    )
  }),
})

export const CleanupWorkersLayer = Layer.mergeAll(
  expiredNotesCleanupLayer,
  reportedRecordsCleanupLayer
)
