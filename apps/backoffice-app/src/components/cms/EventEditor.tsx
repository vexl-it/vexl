'use client'

import {eventResource} from '@/src/services/cms/resources'
import {CmsEditor} from './CmsEditor'
import {EventForm} from './EventForm'

export function EventEditor({id}: {readonly id: string | null}) {
  return (
    <CmsEditor
      resource={eventResource}
      id={id}
      title={id === null ? 'New event' : 'Edit event'}
      renderForm={(props) => <EventForm {...props} />}
    />
  )
}
