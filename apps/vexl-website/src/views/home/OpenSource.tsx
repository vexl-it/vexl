import React from 'react'
import {type PageCopy} from '../../copy/pageCopy'

export function OpenSource({
  t,
}: {
  readonly t: PageCopy<'home'>
}): React.JSX.Element {
  return (
    <div className="section is-open-source">
      <div className="container is-open-source">
        <div className="open-source_wrapper">
          <div className="open-source_claim_wrap">
            <h3 className="h3 is-open-source">{t('openSource.headline')}</h3>
            <a
              href="https://github.com/vexl-it"
              target="_blank"
              rel="noreferrer"
              className="button round is-github w-inline-block"
            >
              <p className="p is-shuffle no-margin">{t('openSource.github')}</p>
            </a>
          </div>
          <div className="open-source_images_wrap">
            <div className="open-source_chat">
              <img
                src="/wf/63bc241907508e9ff1ff7ff1_open-source-chat.png"
                loading="lazy"
                width="496"
                sizes="(max-width: 767px) 100vw, 496px"
                alt=""
                srcSet="/wf/63bc241907508e9ff1ff7ff1_open-source-chat-p-500.png 500w, /wf/63bc241907508e9ff1ff7ff1_open-source-chat-p-800.png 800w, /wf/63bc241907508e9ff1ff7ff1_open-source-chat.png 992w"
                className="open-source_chat_img"
              />
              <p className="open-source-text">
                {t('openSource.text')}
                <br />
                <br />
              </p>
            </div>
            <img
              src="/wf/62fe1464481854f362112159_compare-vexlak.webp"
              loading="lazy"
              width="136"
              alt=""
              className="compare-vexlak"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
