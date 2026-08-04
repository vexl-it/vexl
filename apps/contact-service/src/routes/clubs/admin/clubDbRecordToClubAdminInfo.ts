import {type ClubAdminInfo} from '@vexl-next/domain/src/general/clubs'
import {type ClubDbRecord} from '../../../db/ClubsDbService/domain'

export const clubDbRecordToClubAdminInfo = (
  club: ClubDbRecord
): ClubAdminInfo => ({
  uuid: club.uuid,
  name: club.name,
  description: club.description,
  membersCountLimit: club.membersCountLimit,
  clubImageUrl: club.clubImageUrl,
  validUntil: club.validUntil,
  reportLimit: club.reportLimit,
  report: club.report,
  madeInactiveAt: club.madeInactiveAt,
  madeInactiveReason: club.madeInactiveReason,
})
