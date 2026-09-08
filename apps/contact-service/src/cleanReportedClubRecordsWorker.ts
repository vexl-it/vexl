import {makeRepeatingTaskLayer} from '@vexl-next/server-utils/src/repeatingTask'
import {Effect} from 'effect'
import {
  cleanReportedClubRecordsIntervalMsConfig,
  clubReportLimitIntervalDaysConfig,
} from './configs'
import {ClubMembersDbService} from './db/ClubMemberDbService'

export const CleanReportedClubRecordsWorkerLayer = makeRepeatingTaskLayer({
  queueName: 'contact-service-clean-reported-club-records',
  jobName: 'clean_reported_club_records',
  intervalMs: cleanReportedClubRecordsIntervalMsConfig,
  lockResource: 'contactService:cleanReportedClubRecords',
  lockDuration: '5 minutes',
  task: Effect.gen(function* () {
    const db = yield* ClubMembersDbService
    const clubReportLimitIntervalDays = yield* clubReportLimitIntervalDaysConfig
    yield* db.deleteClubReportedRecordByReportedAtBefore(
      clubReportLimitIntervalDays
    )
  }),
})
