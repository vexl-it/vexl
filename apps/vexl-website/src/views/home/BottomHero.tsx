import React from 'react'
import {type PageCopy} from '../../copy/pageCopy'
import {type Locale, localizedPath} from '../../i18n/locales'
import {QrDownload} from './QrDownload'

export function BottomHero({
  locale,
  t,
}: {
  readonly locale: Locale
  readonly t: PageCopy<'home'>
}): React.JSX.Element {
  return (
    <div className="section is-bottom-hero">
      <div className="container is-bottom-hero">
        <div className="bottom-hero_wrap">
          <div className="bottom-hero_download_wrap">
            <div className="bottom-hero_image_wrap">
              <img
                width="363"
                sizes="(max-width: 479px) 100vw, 363px"
                alt=""
                src="/wf/6a1049667b2e1b220d340486_hp_footer.webp"
                loading="lazy"
                srcSet="/wf/6a1049667b2e1b220d340486_hp_footer-p-500.webp 500w, /wf/6a1049667b2e1b220d340486_hp_footer-p-800.webp 800w, /wf/6a1049667b2e1b220d340486_hp_footer-p-1080.webp 1080w, /wf/6a1049667b2e1b220d340486_hp_footer.webp 1200w"
                className="bottom-hero_image"
              />
            </div>
            <div className="bottom-hero_body">
              <div className="glasses is-bottom-hero">
                <img
                  width="46"
                  loading="lazy"
                  alt=""
                  src="/wf/6316ed77de654cc4234cd8ce_glasses-black.webp"
                  className="glasses-image"
                />
              </div>
              <h3 className="h3 is-black is-bottom-hero">
                {t('bottomHero.headline')}
              </h3>
              <QrDownload
                isYellow={false}
                scanToDownload={t('bottomHero.scanToDownload')}
                arrowHref={localizedPath(locale, '/download-old2')}
                buttonClassName="white"
                buttonText={t('bottomHero.downloadButton')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
