import {Badge, type Tone} from '@/src/components/ui'
import {clubStatus, type ClubStatus} from '@/src/services/clubs'
import {type ClubAdminInfo} from '@vexl-next/domain/src/general/clubs'

const STATUSES: Record<
  ClubStatus,
  {readonly tone: Tone; readonly label: string}
> = {
  active: {tone: 'success', label: 'Active'},
  expiresSoon: {tone: 'warning', label: 'Expires soon'},
  expired: {tone: 'warning', label: 'Expired'},
  inactive: {tone: 'danger', label: 'Inactive'},
}

export function ClubStatusBadge({club}: {readonly club: ClubAdminInfo}) {
  const {tone, label} = STATUSES[clubStatus(club)]
  return <Badge tone={tone}>{label}</Badge>
}
