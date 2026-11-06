import React from 'react'
import {type PageCopy} from '../../copy/pageCopy'
import {LineRevealHeading} from './LineRevealHeading'

export function Claim({t}: {readonly t: PageCopy<'home'>}): React.JSX.Element {
  return (
    <div className="section is-claim">
      <div className="container is-claim">
        <div className="miniclaim-wrap">
          <div className="glasses">
            <img
              src="/wf/63088c60442a08324b0046b6_glasses-yellow.webp"
              loading="lazy"
              width="46"
              alt=""
              className="glasses-image"
            />
          </div>
          <h6 className="h6 is-yellow">{t('claim.miniclaim')}</h6>
        </div>
        <LineRevealHeading>{t('claim.headline')}</LineRevealHeading>
      </div>
    </div>
  )
}
