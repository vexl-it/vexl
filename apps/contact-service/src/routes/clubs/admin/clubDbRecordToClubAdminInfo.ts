import {type ClubAdminInfo} from '@vexl-next/domain/src/general/clubs'
import {type ClubAdminDbRecord} from '../../../db/ClubsDbService/domain'

export const clubDbRecordToClubAdminInfo = (
  club: ClubAdminDbRecord
): ClubAdminInfo => ({
  uuid: club.uuid,
  name: club.name,
  description: club.description,
  membersCountLimit: club.membersCountLimit,
  membersCount: club.membersCount,
  membersJoinedLast30Days: club.membersJoinedLast30Days,
  membersLeftLast30Days: club.membersLeftLast30Days,
  clubImageUrl: club.clubImageUrl,
  validUntil: club.validUntil,
  reportLimit: club.reportLimit,
  report: club.report,
  madeInactiveAt: club.madeInactiveAt,
  madeInactiveReason: club.madeInactiveReason,
})
