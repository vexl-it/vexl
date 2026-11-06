import React from 'react'
import {ArrowIcon} from '../../components/ArrowIcon'
import {AppStoreIcon} from './AppStoreIcon'

/** The QR code with an arrow link (desktop) and the download button (mobile). */
export function QrDownload({
  isYellow,
  scanToDownload,
  arrowHref,
  buttonClassName,
  buttonText,
}: {
  readonly isYellow: boolean
  readonly scanToDownload: React.ReactNode
  readonly arrowHref: string
  readonly buttonClassName: string
  readonly buttonText: React.ReactNode
}): React.JSX.Element {
  return (
    <>
      <div className="qr-code_wrap">
        <div className="qr-code_image_wrap">
          <img
            src="/wf/63971d7ab761b054a393e369_QR.webp"
            loading="lazy"
            width="300"
            sizes="(max-width: 479px) 100vw, 300px"
            alt=""
            srcSet="/wf/63971d7ab761b054a393e369_QR-p-500.webp 500w, /wf/63971d7ab761b054a393e369_QR-p-800.webp 800w, /wf/63971d7ab761b054a393e369_QR.webp 1026w"
            className="qr-code cta"
          />
        </div>
        <div className="qr-code_text">
          <p className={isYellow ? 'p-large is-yellow' : 'p-large is-black'}>
            {scanToDownload}
          </p>
          <a href={arrowHref} className="qr-code_download_arrow w-inline-block">
            <ArrowIcon className={isYellow ? 'is-yellow' : ''} />
          </a>
        </div>
      </div>
      <div className="qr-code_mobile_wrap">
        {/* Live links here without the locale prefix on every language */}
        <a
          href="/download"
          className={`button ${buttonClassName} w-inline-block`}
        >
          <AppStoreIcon />
          <p className="p-large is-black">{buttonText}</p>
        </a>
      </div>
    </>
  )
}
