'use client'

import {type CmsStatus} from '@vexl-next/domain/src/general/cms'

export function StatusBadge({status}: {readonly status: CmsStatus}) {
  return (
    <span
      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
        status === 'published'
          ? 'bg-green-100 text-green-800'
          : 'bg-yellow-100 text-yellow-800'
      }`}
    >
      {status === 'published' ? 'Published' : 'Draft'}
    </span>
  )
}
