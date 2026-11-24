import React from 'react'
import {ArrowIcon} from '../../components/ArrowIcon'
import {type PageCopy} from '../../copy/pageCopy'

export function WhyFoundation({
  t,
}: {
  readonly t: PageCopy<'home'>
}): React.JSX.Element {
  return (
    <div className="container is-compare">
      <h1 className="h2">{t('structure.headline')}</h1>
      <div className="whyvexlcontent">
        <div className="vexl-donate w-row">
          <div className="vexl w-col w-col-8">
            <div className="vexlbox">
              <div className="vexlwrap">
                <img
                  src="/wf/6462231fdd9a4b30fc916e6c_Vexl-logo-yellow-on-transparent.svg"
                  loading="lazy"
                  width={230}
                  alt=""
                  className="satoshi-labs-logo"
                />
              </div>
              <div className="vexlboxcontent">
                <p className="p white">
                  {t('structure.vexl.text')}
                  <br />
                </p>
              </div>
              <a
                href="https://vexl.it"
                {...t.attr('aria-label', 'structure.vexl.linkLabel')}
                className="satoshi-link w-inline-block"
              >
                <ArrowIcon className="is-black" />
              </a>
              <div className="phone">
                <img
                  src="/wf/647ce75bc78e3460591d32c6_Vexl_phone.png"
                  loading="lazy"
                  alt=""
                  className="image-4"
                />
              </div>
            </div>
          </div>
          <div className="donate w-col w-col-4">
            <div className="donatebox">
              <div className="donatecontent w-row">
                <div className="contribute w-col w-col-8">
                  <p className="h4">{t('structure.donate.headline')}</p>
                </div>
                <div className="donatebutton w-col w-col-4">
                  <a
                    href="https://donate.vexl.foundation/"
                    className="button donate w-button"
                  >
                    {t('structure.donate.button')}
                  </a>
                </div>
              </div>
              <div className="heartbox">
                <img
                  src="/wf/64622a195bf4a6c7a7fb7865_Heart.png"
                  loading="lazy"
                  alt=""
                  className="heart"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="satoshi-box_wrap">
          <img
            src="/wf/64622ff88c7f3a111ad157be_SL_logo.svg"
            loading="lazy"
            alt=""
            className="image-2"
          />
          <div className="satoshi-labs-logo_wrap">
            <img
              src="/wf/64622e0317f0bca3e86d3de3_White-logo-on-transparent-horizontal-1.svg"
              loading="lazy"
              width={230}
              alt=""
              className="satoshi-labs-logo"
            />
          </div>
          <div className="satoshi-box_content">
            <h3 className="h3">{t('structure.satoshi.headline')}</h3>
            <p className="p white">
              {t('structure.satoshi.text')}
              <br />
            </p>
          </div>
          <a
            href="https://satoshilabs.com/our-story"
            {...t.attr('aria-label', 'structure.satoshi.linkLabel')}
            className="satoshi-link dark w-inline-block"
          >
            <ArrowIcon className="is-white" />
          </a>
        </div>
      </div>
    </div>
  )
}
