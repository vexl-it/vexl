import {Array} from 'effect'
import React from 'react'
import {type CopyKey} from '../../copy/copyFiles'
import {type PageCopy} from '../../copy/pageCopy'

const theses = [
  {
    cardClass: 'card-wrap is-friends',
    imageClass: 'friends-only_image',
    base: '/wf/6462201bc3b4839be458abe3_Frame-592',
    copyKey: 'theses.1',
  },
  {
    cardClass: 'card-wrap _2',
    imageClass: 'secret-chat_image',
    base: '/wf/646220b057d02c30d7332c3a_Frame-592-1',
    copyKey: 'theses.2',
  },
  {
    cardClass: 'card-wrap _3',
    imageClass: 'no-data-stored_image',
    base: '/wf/6462201b6fe1022b88ec8583_Frame-592-2',
    copyKey: 'theses.3',
  },
] satisfies ReadonlyArray<{
  readonly cardClass: string
  readonly imageClass: string
  readonly base: string
  readonly copyKey: CopyKey<'home'>
}>

export function Theses({t}: {readonly t: PageCopy<'home'>}): React.JSX.Element {
  return (
    <div className="_3theses is-anonym">
      <h1 className="h2">{t('theses.headline')}</h1>
      <div className="cards-wrap">
        {Array.map(theses, (thesis) => (
          <div key={thesis.copyKey} className={thesis.cardClass}>
            <div className="card-image_wrap">
              <img
                src={`${thesis.base}.jpg`}
                loading="lazy"
                width={357}
                sizes="(max-width: 479px) 100vw, 357px"
                alt=""
                srcSet={`${thesis.base}-p-500.jpg 500w, ${thesis.base}-p-800.jpg 800w, ${thesis.base}-p-1080.jpg 1080w, ${thesis.base}.jpg 1128w`}
                className={thesis.imageClass}
              />
            </div>
            <p className="p black bold">{t(thesis.copyKey)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
