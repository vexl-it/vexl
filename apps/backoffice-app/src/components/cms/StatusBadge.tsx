import {Badge} from '@/src/components/ui'
import {isScheduled} from '@/src/services/cms/resources'
import {type CmsStatus} from '@vexl-next/domain/src/general/cms'

export function StatusBadge({
  status,
  visibleFrom,
}: {
  readonly status: CmsStatus
  /** A published item with a later date shows as scheduled. */
  readonly visibleFrom?: Date
}) {
  if (isScheduled(status, visibleFrom))
    return <Badge tone="info">Scheduled</Badge>
  return status === 'published' ? (
    <Badge tone="success">Published</Badge>
  ) : (
    <Badge tone="warning">Draft</Badge>
  )
}
