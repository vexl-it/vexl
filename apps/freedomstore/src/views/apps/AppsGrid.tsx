import {Array} from 'effect'
import React from 'react'
import {AppCardContent} from '../../components/AppCardContent'
import {type PageCopy} from '../../copy/pageCopy'
import {STORE_APPS} from '../../data/apps'

export function AppsGrid({
  shared,
}: {
  readonly shared: PageCopy<'shared'>
}): React.JSX.Element {
  return (
    <section id="APP2" className="section-resource">
      <div className="global-wrap its-apd">
        <div className="w-layout-hflex heading-section">
          <div className="heading-left">
            <h6 className="h6">{shared('apps.sectionNumber')}</h6>
            <h3 className="h3">{shared('apps.sectionTitle')}</h3>
          </div>
          <div className="heading-right">
            <img
              src="/wf/6846e718c00fc4c7e01bb21a_symbol.svg"
              loading="lazy"
              alt=""
              className="icon-symbol"
            />
          </div>
        </div>
        <div className="apps-list-wrap w-dyn-list">
          <div role="list" className="apps-collections-list w-dyn-items w-row">
            {Array.map(STORE_APPS, (app) => (
              <div
                key={app.number}
                role="listitem"
                className="apps-item w-dyn-item w-col w-col-4"
              >
                <div className="card">
                  <AppCardContent app={app} t={shared} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
