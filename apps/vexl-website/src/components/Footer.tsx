import React from 'react'
import {chrome} from '../i18n/chrome'
import {type Locale, localizedPath} from '../i18n/locales'
import {ArrowIcon} from './ArrowIcon'

const socialLinks = [
  {
    href: 'https://youtube.com/playlist?list=PL1Ql2bWcoklYsgn7dkgjjuq_9dJMMo77E&si=yIWDyQ0NOwRi6W9i',
    icon: '/wf/66624faf06ad6fcf7c2ea7e2_Youtube.svg',
    iconWidth: 32,
    title: () => 'Youtube',
    text: (t: Messages) => t.youtube,
  },
  {
    href: 'https://mobile.twitter.com/vexl',
    icon: '/wf/65fc4ba248aadc1248a0e743_X-logo.svg',
    title: () => 'X',
    text: (t: Messages) => t.x,
  },
  {
    href: 'https://njump.me/npub1mftv2j67vayavkks8rqev3u8jjhefe86tf80msstfxvpunk9vmps6prkl3',
    icon: '/wf/678e271e655642129fbf4c67_Sni-mek_obrazovky_2025-01-20_v_11.31.46-removebg-preview-1.png',
    title: () => 'Nostr',
    text: (t: Messages) => t.nostr,
  },
  {
    href: 'https://vex-it-website-v2.vercel.app/brand',
    icon: '/wf/647dddc883208de4d8e7320a_Kit.svg',
    title: (t: Messages) => t.brandManual,
    text: (t: Messages) => t.brandManualText,
  },
] as const

type Messages = (typeof chrome)['en']

/** The link cards and the bottom bar that close most pages. */
export function Footer({locale}: {readonly locale: Locale}): React.JSX.Element {
  const t = chrome[locale]
  return (
    <>
      <div className="section is-footer-links">
        <div className="container is-footer-links">
          {socialLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              className="footer-box_wrap w-inline-block"
              rel="noreferrer"
            >
              <div className="footer-icon_wrap">
                <img
                  src={link.icon}
                  loading="lazy"
                  width={'iconWidth' in link ? link.iconWidth : undefined}
                  alt=""
                  className="footer-box-image"
                />
              </div>
              <div className="footer-content_wrap">
                <div className="footer-content_headline">
                  <h5 className="h5">{link.title(t)}</h5>
                  <div className="arrow-wrap">
                    <ArrowIcon className="is-yellow" />
                  </div>
                </div>
                <p className="p">{link.text(t)}</p>
              </div>
            </a>
          ))}
          <div className="footer-box_wrap">
            <div className="footer-icon_wrap">
              <img
                src="/wf/63183b7f7e3405322d76d710_Flag.webp"
                loading="lazy"
                width={32}
                alt=""
                className="footer-box-image"
              />
            </div>
            <div className="footer-content_wrap">
              <div className="footer-content_headline">
                <h5 className="h5">{t.contactUs}</h5>
              </div>
              <p className="p">
                Vexl s.r.o
                <br />
                Kundratka 2359/17a
                <br />
                180 00 Praha, Česká republika
                <br />
                ‍
                <br />
                IČO: 17270642
                <br />
                email: support@vexl.it
                <br />
              </p>
            </div>
          </div>
        </div>
      </div>
      <footer className="section is-footer-icon">
        <div className="container is-footer-icon">
          <a
            href={localizedPath(locale, '/terms-privacy')}
            className="p terms-link"
          >
            {t.termsPrivacy}
          </a>
          <div className="glassses">
            <img
              width={97.5}
              loading="lazy"
              alt="Vexl glasses"
              src="/wf/62fb7130b9491eced45079f8_sunglasses.webp"
              className="glasses-image"
            />
          </div>
          <p className="p">{t.rights}</p>
        </div>
      </footer>
    </>
  )
}
