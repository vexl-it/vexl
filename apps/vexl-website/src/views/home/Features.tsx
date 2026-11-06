import {Array, pipe} from 'effect'
import React from 'react'
import {type PageCopy} from '../../copy/pageCopy'

const features = [
  {
    key: 'friends',
    cardClassName: 'card-wrap is-basic-icon-card',
    icon: '/wf/6a267dacec1827f781fa3c18_vexl-icon-1.svg',
  },
  {
    key: 'marketplace',
    cardClassName: 'card-wrap is-basic-icon-card',
    icon: '/wf/6a267dac2d8d2b30dfca358e_vexl-icon-2.svg',
  },
  {
    key: 'noData',
    cardClassName: 'card-wrap is-basic-icon-card',
    icon: '/wf/6a267dac8424dead1145c988_vexl-icon-3.svg',
  },
  {
    key: 'anonymisation',
    cardClassName:
      'card-wrap is-basic-icon-card w-variant-b323ad8f-3e6c-1228-c686-879756b9631e',
    icon: '/wf/6a267dac3ea5da7eb9af64d8_vexl-icon-4.svg',
  },
] satisfies ReadonlyArray<{
  key: 'friends' | 'marketplace' | 'noData' | 'anonymisation'
  cardClassName: string
  icon: string
}>

export function Features({
  t,
}: {
  readonly t: PageCopy<'home'>
}): React.JSX.Element {
  return (
    <section className="section">
      <div className="container is-base-pading is-basic-cards">
        <div className="cards-wrap is-basic-card">
          {pipe(
            features,
            Array.map(({key, cardClassName, icon}) => (
              <div key={key} className={cardClassName}>
                <div className="card-image_wrap is-basic-icon">
                  <img
                    width="357"
                    src={icon}
                    alt=""
                    loading="lazy"
                    className="basic-icon-omg"
                  />
                </div>
                <div className="card-content_wrap is-basic-content">
                  <div className="card-title_wrap">
                    <h5 className="h6">{t(`features.${key}.title`)}</h5>
                  </div>
                  <p className="text-card-small">{t(`features.${key}.text`)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
