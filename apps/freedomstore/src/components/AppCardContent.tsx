import {Array} from 'effect'
import React from 'react'
import {type PageCopy} from '../copy/pageCopy'
import {type StoreApp} from '../data/apps'

export function AppCardContent({
  app,
  t,
}: {
  readonly app: StoreApp
  readonly t: PageCopy<'shared'>
}): React.JSX.Element {
  return (
    <>
      <div className="w-layout-hflex card-top">
        <p className="text-xs">{t('apps.cardLabel')}</p>
        <p className="text-xs">{t('apps.cardPlus')}</p>
      </div>
      <a
        href={app.href}
        target="_blank"
        rel="noreferrer"
        className="card-inner w-inline-block"
      >
        <img
          src={app.icon}
          loading={app.eagerIcon ? 'eager' : 'lazy'}
          alt=""
          className="card-app-logo"
        />
        <h2 className="h2 margin-top-24">{t(app.nameKey)}</h2>
      </a>
      <div className="w-layout-hflex card-bottom">
        <div className="wrapper">
          <div className="w-layout-hflex tag">
            <p className="text-xs its-tag">{app.number}</p>
          </div>
        </div>
        <div className="wrapper">
          {Array.map(app.tagKeys, (tagKey) => (
            <div key={tagKey} className="w-layout-hflex tag its-outline">
              <p className="text-xs its-tag">{t(tagKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
