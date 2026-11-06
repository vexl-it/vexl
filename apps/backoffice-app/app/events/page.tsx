'use client'

import {CmsListPage} from '@/src/components/cms/CmsListPage'
import {formatDateTime} from '@/src/services/cms/dateTimeLocal'
import {eventResource} from '@/src/services/cms/resources'

export default function EventsPage() {
  return (
    <CmsListPage
      resource={eventResource}
      title="Events"
      newLabel="New event"
      publishFromList
      itemName={(event) => event.name}
      columns={[
        {
          header: 'Name',
          render: (event) => (
            <div className="font-medium text-gray-900">{event.name}</div>
          ),
        },
        {header: 'Venue', render: (event) => event.venue},
        {header: 'Starts', render: (event) => formatDateTime(event.startDate)},
      ]}
    />
  )
}
