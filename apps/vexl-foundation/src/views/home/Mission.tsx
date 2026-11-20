import React from 'react'
import {type PageCopy} from '../../copy/pageCopy'

export function Mission({
  t,
}: {
  readonly t: PageCopy<'home'>
}): React.JSX.Element {
  return (
    <div className="h-p hor w-row">
      <div className="header w-col w-col-4">
        <h2 className="h2">{t('mission.headline')}</h2>
      </div>
      <div className="paragraph w-col w-col-8">
        <p className="p white">{t('mission.text')}</p>
      </div>
    </div>
  )
}
