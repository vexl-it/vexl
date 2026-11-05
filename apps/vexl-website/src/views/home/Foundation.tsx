import React from 'react'
import {ArrowIcon} from '../../components/ArrowIcon'
import {type HomeMessages} from '../../i18n/home'

export function Foundation({
  t,
}: {
  readonly t: HomeMessages['foundation']
}): React.JSX.Element {
  return (
    <div className="section is-satoshi">
      <div className="container is-satoshi">
        <div className="satoshi-box_wrap vexl">
          <div className="vexl-found-logo_wrap">
            <img
              src="/wf/647de30757f12027a8802f86_Vexl-found-logo-white-on-transparent.svg"
              loading="lazy"
              width="230"
              alt=""
              className="satoshi-labs-logo"
            />
          </div>
          <div className="satoshi-box_content">
            <h3 className="h3">{t.headline}</h3>
            <p className="p">
              {t.text}
              <br />
            </p>
          </div>
          <a
            href="https://vexl.foundation/"
            className="satoshi-link w-inline-block"
          >
            <ArrowIcon className="is-black" />
          </a>
          <div className="vexl_phone">
            <img
              src="/wf/64805fa6f32d469e9ce00b3c_heart_logo.png"
              loading="lazy"
              sizes="(max-width: 504px) 100vw, 504px"
              srcSet="/wf/64805fa6f32d469e9ce00b3c_heart_logo-p-500.png 500w, /wf/64805fa6f32d469e9ce00b3c_heart_logo.png 504w"
              alt=""
              className="image"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
