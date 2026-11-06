import {Array, pipe} from 'effect'
import React from 'react'
import {type PageCopy} from '../../copy/pageCopy'

const steps = [
  {
    key: 'contacts',
    cardClassName:
      'card-wrap is-how-it-works-card w-variant-61f2dd11-56d2-4554-1ee2-f724b162e835',
    image: '/wf/6a267a671259195ee9aac783_vexl-how-1.png',
    imageClassName:
      'how-it-works-img w-variant-61f2dd11-56d2-4554-1ee2-f724b162e835',
  },
  {
    key: 'offers',
    cardClassName: 'card-wrap is-how-it-works-card',
    image: '/wf/6a267a67a70270fa09fe9483_vexl-how-2.png',
    imageClassName: 'how-it-works-img',
  },
  {
    key: 'chat',
    cardClassName:
      'card-wrap is-how-it-works-card w-variant-89401694-bc1e-55bd-bfa1-b58fb8a81614',
    image: '/wf/6a267a6702352cf869c6ffc8_vexl-how-3.png',
    imageClassName: 'how-it-works-img',
  },
  {
    key: 'meet',
    cardClassName:
      'card-wrap is-how-it-works-card w-variant-7a0a57d2-fed5-4241-258f-7c006309a259',
    image: '/wf/6a267a67552736c94e4b9dd7_vexl-how-4.png',
    imageClassName: 'how-it-works-img',
  },
] satisfies ReadonlyArray<{
  key: 'contacts' | 'offers' | 'chat' | 'meet'
  cardClassName: string
  image: string
  imageClassName: string
}>

export function HowItWorks({
  t,
}: {
  readonly t: PageCopy<'home'>
}): React.JSX.Element {
  return (
    <section className="section">
      <div className="container is-base-pading is-how-it-works is-how-it-works-v2">
        <div className="large-title-wrapper">
          <h2 className="h2">{t('howItWorks.headline')}</h2>
        </div>
        <div className="cards-wrap is-how-it-works">
          {pipe(
            steps,
            Array.map(({key, cardClassName, image, imageClassName}, index) => (
              <div key={key} className={cardClassName}>
                <div className="card-image_wrap is-how-it-works">
                  <img
                    width="357"
                    loading="lazy"
                    alt=""
                    src={image}
                    className={imageClassName}
                  />
                </div>
                <div className="card-content_wrap">
                  <div className="card-title_wrap">
                    <h5 className="h6 is-number">{`${index + 1}.`}</h5>
                    <h5 className="h6">{t(`howItWorks.${key}.title`)}</h5>
                  </div>
                  <p className="text-card-small">
                    {t(`howItWorks.${key}.text`)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
