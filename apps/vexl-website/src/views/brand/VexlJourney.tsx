import {Array, pipe} from 'effect'
import React from 'react'
import {type BrandCopy} from './BrandPage'

/** Each milestone has `journey.<id>.date`, `.title` and `.text` copy keys. */
const milestones = [
  'origins',
  'chaincamp',
  'openSource',
  'foundation',
  'v2',
  'opensats',
  'goods',
  'clubs',
  'freedomStore',
  'newCeo',
  'redesign',
] as const

export function VexlJourney({t}: {readonly t: BrandCopy}): React.JSX.Element {
  return (
    <section className="container is-base-pading brand-block">
      <ol className="brand-timeline">
        {pipe(
          milestones,
          Array.map((milestone) => (
            <li key={milestone} className="brand-milestone">
              <p className="brand-milestone_date">
                {t(`journey.${milestone}.date`)}
              </p>
              <div>
                <h2 className="h6 brand-milestone_title">
                  {t(`journey.${milestone}.title`)}
                </h2>
                <p className="brand-text">{t(`journey.${milestone}.text`)}</p>
              </div>
            </li>
          ))
        )}
      </ol>
    </section>
  )
}
