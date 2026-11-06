import {Array, pipe} from 'effect'
import React from 'react'
import {type CopyKey} from '../../copy/copyFiles'
import {type PageCopy} from '../../copy/pageCopy'
import {type Locale, localizedPath} from '../../i18n/locales'

type Label = Extract<CopyKey<'home'>, `noKyc.${string}`>

const messageImages: Record<Locale, string> = {
  en: '/wf/666236118d31f54f579689d2_Zprava.png',
  cs: '/wf/66d76911e660ce070afb747e_Frame-7254.png',
}

const exchangeRequires = [
  {label: 'noKyc.name', icon: '/wf/6316fc2e197d7250ef122f3f_name-grey.webp'},
  {
    label: 'noKyc.phoneNumber',
    icon: '/wf/6316fc2efe700462e5074bcf_phone-gray.webp',
  },
  {
    label: 'noKyc.selfie',
    icon: '/wf/6316fcac7ce298557fcebaf0_selfie-gray.webp',
  },
  {
    label: 'noKyc.creditCard',
    icon: '/wf/6316fc2ead5e0617afafc8b0_card-gray.webp',
  },
  {
    label: 'noKyc.address',
    icon: '/wf/6316fc2e00a14945598cb63e_adress-gray.webp',
  },
  {label: 'noKyc.email', icon: '/wf/6316fc2e72173382eeae1823_email-gray.webp'},
  {
    label: 'noKyc.bankAccount',
    icon: '/wf/6316fc2e7fc64b4d5bce4a61_bank-gray.webp',
  },
] satisfies ReadonlyArray<{label: Label; icon: string}>

const vexlRequires = [
  {
    label: 'noKyc.nickname',
    icon: '/wf/6316fc2efee31721de09328b_name-black.webp',
  },
  {
    label: 'noKyc.phoneNumber',
    icon: '/wf/6316fc2eca1158429e50b682_phone-black.webp',
  },
] satisfies ReadonlyArray<{label: Label; icon: string}>

function CompareItem({
  icon,
  label,
  textClassName,
}: {
  readonly icon: string
  readonly label: React.ReactNode
  readonly textClassName: string
}): React.JSX.Element {
  return (
    <div className="compare-item">
      <img
        src={icon}
        loading="lazy"
        width="40"
        alt=""
        className="compare-icon"
      />
      <p className={textClassName}>{label}</p>
    </div>
  )
}

export function NoKyc({
  locale,
  t,
}: {
  readonly locale: Locale
  readonly t: PageCopy<'home'>
}): React.JSX.Element {
  return (
    <section className="section-3">
      <h1 className="h1 is-features">{t('noKyc.headline')}</h1>
      <div className="w-layout-blockcontainer container-4 w-container">
        <div className="div-block-23">
          <div className="div-block-24">
            <p className="p-large is-black is-compare-headline-2">
              {t('noKyc.everyExchange')}
            </p>
            <div className="div-block-25">
              {pipe(
                exchangeRequires,
                Array.map(({label, icon}) => (
                  <CompareItem
                    key={label}
                    icon={icon}
                    label={t(label)}
                    textClassName="p is-white"
                  />
                ))
              )}
              <div className="div-block-28" />
            </div>
            <div className="div-block-27" />
          </div>
          <div className="div-block-26">
            <div>
              <h5 className="h5 is-white compare">{t('noKyc.vexl')}</h5>
              {pipe(
                vexlRequires,
                Array.map(({label, icon}) => (
                  <CompareItem
                    key={label}
                    icon={icon}
                    label={t(label)}
                    textClassName="p is-black"
                  />
                ))
              )}
            </div>
            <div className="div-block-29">
              <img
                src="/wf/666235e1d8f14a938880730c_Vexlak.png"
                loading="lazy"
                alt=""
                className="image-14"
              />
              <img
                src={messageImages[locale]}
                loading="lazy"
                alt=""
                className="image-15"
              />
              <a
                href={localizedPath(locale, '/download-old2')}
                className="button download compare w-button"
              >
                {t('noKyc.downloadButton')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
