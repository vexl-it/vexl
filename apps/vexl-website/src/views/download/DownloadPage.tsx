import {Array, pipe} from 'effect'
import React from 'react'
import {Navbar} from '../../components/Navbar'
import {type CopyKey} from '../../copy/copyFiles'
import {type PageCopy} from '../../copy/pageCopy'
import {type Locale, localizedPath} from '../../i18n/locales'

const APPLE_ICON = '/wf/6a917998c8224d0aa7569ea8_Frame.svg'
const ANDROID_ICON = '/wf/6a9179987948ae5f7cef2753_Frame-1.svg'
const ARROW_ICON = '/wf/63075f2debbfaae31f41c786_arrow-top-right.png'

type Key = CopyKey<'download'>

interface DownloadStep {
  readonly title: Key
  readonly text: Key
  /** Shorter text shown on phones instead of `text`. */
  readonly mobileText?: Key
  readonly action?: {
    readonly label: Key
    readonly href: string
    readonly newTab: boolean
  }
}

export interface DownloadVariant {
  readonly path: string
  /** The page the iPhone card's footer links to. */
  readonly otherPath: string
  readonly heading: Key
  readonly iphoneSubtitle: Key
  readonly steps: readonly DownloadStep[]
  readonly footText: Key
  readonly footLink: Key
  readonly otherStoresSubtitle: Key
}

export const euDownload: DownloadVariant = {
  path: '/download',
  otherPath: '/download-noneu',
  heading: 'eu.heading',
  iphoneSubtitle: 'eu.iphone.subtitle',
  steps: [
    {
      title: 'eu.iphone.altStore.title',
      text: 'eu.iphone.altStore.text',
      mobileText: 'eu.iphone.altStore.mobileText',
      action: {
        label: 'eu.iphone.altStore.button',
        href: 'https://altstore.io/download',
        newTab: true,
      },
    },
    {
      title: 'eu.iphone.freedomStore.title',
      text: 'eu.iphone.freedomStore.text',
      mobileText: 'eu.iphone.freedomStore.mobileText',
      action: {
        label: 'eu.iphone.freedomStore.button',
        href: 'altstore-pal://source?url=https://source.freedomstore.io/',
        newTab: false,
      },
    },
    {
      title: 'eu.iphone.install.title',
      text: 'eu.iphone.install.text',
      mobileText: 'eu.iphone.install.mobileText',
    },
  ],
  footText: 'eu.iphone.footText',
  footLink: 'eu.iphone.footLink',
  otherStoresSubtitle: 'eu.otherStores.subtitle',
}

export const nonEuDownload: DownloadVariant = {
  path: '/download-noneu',
  otherPath: '/download',
  heading: 'nonEu.heading',
  iphoneSubtitle: 'nonEu.iphone.subtitle',
  steps: [
    {
      title: 'nonEu.iphone.testFlight.title',
      text: 'nonEu.iphone.testFlight.text',
      action: {
        label: 'nonEu.iphone.testFlight.button',
        href: 'https://apps.apple.com/us/app/testflight/id899247664?mt=8',
        newTab: true,
      },
    },
    {
      title: 'nonEu.iphone.vexl.title',
      text: 'nonEu.iphone.vexl.text',
      action: {
        label: 'nonEu.iphone.vexl.button',
        href: 'https://testflight.apple.com/join/SuPp5FF2',
        newTab: true,
      },
    },
  ],
  footText: 'nonEu.iphone.footText',
  footLink: 'nonEu.iphone.footLink',
  otherStoresSubtitle: 'nonEu.otherStores.subtitle',
}

/** The `/download` and `/download-noneu` pages: they differ in the iPhone card only. */
export function DownloadPage({
  locale,
  variant: page,
  t,
  jsonLd,
}: {
  readonly locale: Locale
  readonly variant: DownloadVariant
  readonly t: PageCopy<'download'>
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
      <Navbar locale={locale} path={page.path} variant="light" />
      <div className="dlp_page">
        <section className="dlp_hero">
          <div className="dlp_wrap">
            <h1 className="heading-5">{t(page.heading)}</h1>
            <div className="dlp_fork">
              <a href="#iphone" className="button dlp_fork-btn w-inline-block">
                <img src={APPLE_ICON} alt="" className="dlp_icon" />
                {t('fork.iphone')}
              </a>
              <a href="#android" className="button dlp_fork-btn w-inline-block">
                <img src={ANDROID_ICON} alt="" className="dlp_icon" />
                {t('fork.android')}
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
                title={t('iphone.title')}
                subtitle={t(page.iphoneSubtitle)}
              />
              {pipe(
                page.steps,
                Array.map((step, index) => (
                  <Step key={step.title} number={index + 1} step={step} t={t} />
                ))
              )}
              <div className="dlp_card-foot">
                <img
                  src="/wf/6a9179985295d2083ce7cb56_Frame-8.svg"
                  alt=""
                  className="dlp_badge-in"
                />
                <p className="p dlp_foot-text">{t(page.footText)}</p>
                <a
                  href={localizedPath(locale, page.otherPath)}
                  className="dlp_link"
                >
                  {t(page.footLink)}
                </a>
              </div>
            </div>
            <div id="android" className="dlp_card">
              <CardHead
                className="dlp_card-head"
                icon={ANDROID_ICON}
                title={t('android.title')}
                subtitle={t('android.subtitle')}
              >
                <a
                  rel="noopener noreferrer"
                  href="https://play.google.com/store/apps/details?id=it.vexl.next"
                  target="_blank"
                  className="button dlp_btn-primary is-inline w-inline-block"
                >
                  {t('android.googlePlay')}
                  <img src={ARROW_ICON} alt="" className="dlp_chev" />
                </a>
              </CardHead>
            </div>
            <div id="alt-android" className="dlp_card">
              <CardHead
                className="dlp_card-head"
                icon={ANDROID_ICON}
                title={t('alternatives.title')}
                subtitle={t('alternatives.subtitle')}
              />
              <div className="dlp_group">
                <h3 className="p dlp_group-h">{t('otherStores.title')}</h3>
                <p className="p dlp_group-sub">{t(page.otherStoresSubtitle)}</p>
                <div className="dlp_btn-row">
                  <OutlineButton
                    href="https://auroraoss.com/"
                    icon="/wf/6a9179987948ae5f7cef275a_Frame-2.svg"
                    label={t('otherStores.aurora')}
                  />
                  <OutlineButton
                    href="https://zapstore.dev/"
                    icon="/wf/6a9179981e58162ad78749d4_Frame-3.svg"
                    label={t('otherStores.zapstore')}
                  />
                </div>
              </div>
              <div className="dlp_group">
                <h3 className="p dlp_group-h">{t('otherWays.title')}</h3>
                <p className="p dlp_group-sub">{t('otherWays.subtitle')}</p>
                <div className="dlp_btn-row">
                  <OutlineButton
                    href="https://github.com/vexl-it/vexl/releases/latest"
                    icon="/wf/6a917998fc16da1b70d061dd_Frame-4.svg"
                    label={t('otherWays.github')}
                  />
                  <img src={ARROW_ICON} alt="" className="dlp_chain" />
                  <OutlineButton
                    href="https://obtainium.imranr.dev/"
                    icon="/wf/6a9179985295d2083ce7cb5a_Frame-5.svg"
                    label={t('otherWays.obtainium')}
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
                  <h2 className="h2 dlp_card-title is-title-sm">
                    {t('freedom.title')}
                  </h2>
                  <p className="p dlp_card-sub">{t('freedom.subtitle')}</p>
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
  readonly title: React.ReactNode
  readonly subtitle: React.ReactNode
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
  t,
}: {
  readonly number: number
  readonly step: DownloadStep
  readonly t: PageCopy<'download'>
}): React.JSX.Element {
  return (
    <div className="dlp_step">
      <div className="dlp_step-num">{number}</div>
      <div className="dlp_step-text">
        <h3 className="p dlp_step-title">{t(step.title)}</h3>
        {step.mobileText ? (
          <>
            <p className="p dlp_step-copy dlp_desk-only">{t(step.text)}</p>
            <p className="p dlp_step-copy dlp_mob-only">{t(step.mobileText)}</p>
          </>
        ) : (
          <p className="p dlp_step-copy">{t(step.text)}</p>
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
            {t(step.action.label)}
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
  readonly label: React.ReactNode
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
