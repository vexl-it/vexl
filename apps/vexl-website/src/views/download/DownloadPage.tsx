import {Array, pipe} from 'effect'
import React from 'react'
import {Navbar} from '../../components/Navbar'
import {type DownloadMessages, type DownloadStep} from '../../i18n/download'
import {type Locale, localizedPath} from '../../i18n/locales'

const APPLE_ICON = '/wf/6a917998c8224d0aa7569ea8_Frame.svg'
const ANDROID_ICON = '/wf/6a9179987948ae5f7cef2753_Frame-1.svg'
const ARROW_ICON = '/wf/63075f2debbfaae31f41c786_arrow-top-right.png'

/** The `/download` and `/download-noneu` pages: they differ in the iPhone card only. */
export function DownloadPage({
  locale,
  path,
  otherPath,
  t,
  jsonLd,
}: {
  readonly locale: Locale
  readonly path: string
  /** The page the iPhone card's footer links to. */
  readonly otherPath: string
  readonly t: DownloadMessages
  readonly jsonLd: object
}): React.JSX.Element {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <Navbar locale={locale} path={path} variant="light" />
      <div className="dlp_page">
        <section className="dlp_hero">
          <div className="dlp_wrap">
            <h1 className="heading-5">
              {pipe(
                t.heading,
                Array.map((line, index) => (
                  <React.Fragment key={line}>
                    {index > 0 ? <br /> : null}
                    {line}
                  </React.Fragment>
                ))
              )}
            </h1>
            <div className="dlp_fork">
              <a href="#iphone" className="button dlp_fork-btn w-inline-block">
                <img src={APPLE_ICON} alt="" className="dlp_icon" />
                iPhone
              </a>
              <a href="#android" className="button dlp_fork-btn w-inline-block">
                <img src={ANDROID_ICON} alt="" className="dlp_icon" />
                Android
              </a>
            </div>
          </div>
        </section>
        <div className="dlp_wrap">
          <div className="dlp_cards">
            <div id="iphone" className="dlp_card">
              <CardHead
                className="dlp_card-head ios"
                icon={APPLE_ICON}
                title={t.iphoneTitle}
                subtitle={t.iphoneSubtitle}
              />
              {pipe(
                t.steps,
                Array.map((step, index) => (
                  <Step key={step.title} number={index + 1} step={step} />
                ))
              )}
              <div className="dlp_card-foot">
                <img
                  src="/wf/6a9179985295d2083ce7cb56_Frame-8.svg"
                  alt=""
                  className="dlp_badge-in"
                />
                <p className="p dlp_foot-text">{t.footText}</p>
                <a href={localizedPath(locale, otherPath)} className="dlp_link">
                  {t.footLink}
                </a>
              </div>
            </div>
            <div id="android" className="dlp_card">
              <CardHead
                className="dlp_card-head"
                icon={ANDROID_ICON}
                title={t.android}
                subtitle={t.androidSubtitle}
              >
                <a
                  rel="noopener noreferrer"
                  href="https://play.google.com/store/apps/details?id=it.vexl.next"
                  target="_blank"
                  className="button dlp_btn-primary is-inline w-inline-block"
                >
                  {t.googlePlay}
                  <img src={ARROW_ICON} alt="" className="dlp_chev" />
                </a>
              </CardHead>
            </div>
            <div id="alt-android" className="dlp_card">
              <CardHead
                className="dlp_card-head"
                icon={ANDROID_ICON}
                title={t.alternatives}
                subtitle={t.alternativesSubtitle}
              />
              <div className="dlp_group">
                <h3 className="p dlp_group-h">{t.otherStores}</h3>
                <p className="p dlp_group-sub">{t.otherStoresSubtitle}</p>
                <div className="dlp_btn-row">
                  <OutlineButton
                    href="https://auroraoss.com/"
                    icon="/wf/6a9179987948ae5f7cef275a_Frame-2.svg"
                    label="Aurora Store"
                  />
                  <OutlineButton
                    href="https://zapstore.dev/"
                    icon="/wf/6a9179981e58162ad78749d4_Frame-3.svg"
                    label="Zapstore"
                  />
                </div>
              </div>
              <div className="dlp_group">
                <h3 className="p dlp_group-h">{t.otherWays}</h3>
                <p className="p dlp_group-sub">{t.otherWaysSubtitle}</p>
                <div className="dlp_btn-row">
                  <OutlineButton
                    href="https://github.com/vexl-it/vexl/releases/latest"
                    icon="/wf/6a917998fc16da1b70d061dd_Frame-4.svg"
                    label="GitHub Releases (APK)"
                  />
                  <img src={ARROW_ICON} alt="" className="dlp_chain" />
                  <OutlineButton
                    href="https://obtainium.imranr.dev/"
                    icon="/wf/6a9179985295d2083ce7cb5a_Frame-5.svg"
                    label="Obtainium"
                  />
                </div>
              </div>
            </div>
            <div className="dlp_card">
              <div className="dlp_card-head is-flush">
                <div className="dlp_badge is-badge-sm">
                  <img
                    src="/wf/6a9179982638df704642e5f3_Frame-7.svg"
                    alt=""
                    className="dlp_badge-in"
                  />
                </div>
                <div className="dlp_card-titles">
                  <h2 className="h2 dlp_card-title is-title-sm">{t.freedom}</h2>
                  <p className="p dlp_card-sub">{t.freedomSubtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function CardHead({
  className,
  icon,
  title,
  subtitle,
  children,
}: {
  readonly className: string
  readonly icon: string
  readonly title: string
  readonly subtitle: string
  readonly children?: React.ReactNode
}): React.JSX.Element {
  return (
    <div className={className}>
      <div className="dlp_badge">
        <img src={icon} alt="" className="dlp_badge-in" />
      </div>
      <div className="dlp_card-titles">
        <h2 className="h2 dlp_card-title">{title}</h2>
        <p className="p dlp_card-sub">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function Step({
  number,
  step,
}: {
  readonly number: number
  readonly step: DownloadStep
}): React.JSX.Element {
  const copy = (
    <>
      {step.copy}
      {step.emphasis ? (
        <>
          {' '}
          <strong>{step.emphasis}</strong>
        </>
      ) : null}
    </>
  )
  return (
    <div className="dlp_step">
      <div className="dlp_step-num">{number}</div>
      <div className="dlp_step-text">
        <h3 className="p dlp_step-title">{step.title}</h3>
        {step.mobileCopy ? (
          <>
            <p className="p dlp_step-copy dlp_desk-only">{copy}</p>
            <p className="p dlp_step-copy dlp_mob-only">{step.mobileCopy}</p>
          </>
        ) : (
          <p className="p dlp_step-copy">{copy}</p>
        )}
      </div>
      {step.action ? (
        <div className="dlp_step-act">
          <a
            href={step.action.href}
            className={`button dlp_btn-outline is-yellow${step.action.newTab ? ' w-inline-block' : ''}`}
            {...(step.action.newTab
              ? {rel: 'noopener noreferrer', target: '_blank'}
              : {})}
          >
            {step.action.label}
            <img src={ARROW_ICON} alt="" className="dlp_chev" />
          </a>
        </div>
      ) : null}
    </div>
  )
}

function OutlineButton({
  href,
  icon,
  label,
}: {
  readonly href: string
  readonly icon: string
  readonly label: string
}): React.JSX.Element {
  return (
    <a
      rel="noopener noreferrer"
      href={href}
      target="_blank"
      className="button dlp_btn-outline w-inline-block"
    >
      <img src={icon} alt="" className="dlp_icon" />
      {label}
      <img src={ARROW_ICON} alt="" className="dlp_chev" />
    </a>
  )
}
