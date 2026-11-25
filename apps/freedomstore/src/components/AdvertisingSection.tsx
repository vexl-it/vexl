import React from 'react'
import {type PageCopy} from '../copy/pageCopy'
import {ArrowButton} from './ArrowButton'

export function AdvertisingSection({
  t,
}: {
  readonly t: PageCopy<'shared'>
}): React.JSX.Element {
  return (
    <section
      id="Advertising"
      data-progress-nav-anchor=""
      className="section-web"
    >
      <div className="global-wrap its-adv">
        <div data-slide-in="" className="flex">
          <div className="_1">
            <div className="wrapper vertical gap-36">
              <h2 className="h2">{t('advertising.title')}</h2>
              <div className="width-556">
                <p className="text-xl">{t('advertising.text')}</p>
              </div>
              <div className="wrapper">
                <a
                  href="https://shop.nitrokey.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="link-block w-inline-block"
                >
                  <ArrowButton>{t('advertising.button')}</ArrowButton>
                </a>
              </div>
            </div>
          </div>
          <div className="_1 aligin-horizontal">
            <div className="icon-wrapper">
              <img
                src="/wf/68481c46d96d60d0550b7392_app_freedom.svg"
                loading="lazy"
                alt=""
                className="icon-app"
              />
            </div>
            <h2 className="plus">+</h2>
            <div className="icon-wrapper">
              <img
                src="/wf/68481eadb1286d1226be2fdb_app_nitro.svg"
                loading="lazy"
                alt=""
                className="icon-app"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
