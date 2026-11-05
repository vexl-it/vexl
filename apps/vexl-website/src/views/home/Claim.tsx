import React from 'react'
import {type HomeMessages} from '../../i18n/home'
import {LineRevealHeading} from './LineRevealHeading'

export function Claim({
  t,
}: {
  readonly t: HomeMessages['claim']
}): React.JSX.Element {
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
          <h6 className="h6 is-yellow">
            {t.miniclaim[0]}
            <br />
            {t.miniclaim[1]}
          </h6>
        </div>
        <LineRevealHeading text={t.headline} />
      </div>
    </div>
  )
}
