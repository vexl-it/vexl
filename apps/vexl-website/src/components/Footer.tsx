import React from 'react'
import {type CopyKey} from '../copy/copyFiles'
import {pageCopy} from '../copy/pageCopy'
import {type Locale, localizedPath} from '../i18n/locales'
import {ArrowIcon} from './ArrowIcon'

const socialLinks = [
  {
    href: 'https://youtube.com/playlist?list=PL1Ql2bWcoklYsgn7dkgjjuq_9dJMMo77E&si=yIWDyQ0NOwRi6W9i',
    icon: '/wf/66624faf06ad6fcf7c2ea7e2_Youtube.svg',
    iconWidth: 32,
    title: 'footer.youtube.title',
    text: 'footer.youtube.text',
  },
  {
    href: 'https://mobile.twitter.com/vexl',
    icon: '/wf/65fc4ba248aadc1248a0e743_X-logo.svg',
    title: 'footer.x.title',
    text: 'footer.x.text',
  },
  {
    href: 'https://njump.me/npub1mftv2j67vayavkks8rqev3u8jjhefe86tf80msstfxvpunk9vmps6prkl3',
    icon: '/wf/678e271e655642129fbf4c67_Sni-mek_obrazovky_2025-01-20_v_11.31.46-removebg-preview-1.png',
    title: 'footer.nostr.title',
    text: 'footer.nostr.text',
  },
  {
    href: 'https://vex-it-website-v2.vercel.app/brand',
    icon: '/wf/647dddc883208de4d8e7320a_Kit.svg',
    title: 'footer.brandManual.title',
    text: 'footer.brandManual.text',
  },
] satisfies ReadonlyArray<{
  href: string
  icon: string
  iconWidth?: number
  title: CopyKey<'shared'>
  text: CopyKey<'shared'>
}>

/** The link cards and the bottom bar that close most pages. */
export function Footer({locale}: {readonly locale: Locale}): React.JSX.Element {
  const t = pageCopy(locale, 'shared')
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
                  <h5 className="h5">{t(link.title)}</h5>
                  <div className="arrow-wrap">
                    <ArrowIcon className="is-yellow" />
                  </div>
                </div>
                <p className="p">{t(link.text)}</p>
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
                <h5 className="h5">{t('footer.contact.title')}</h5>
              </div>
              <p className="p">
                {t('footer.contact.text')}
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
            {t('footer.termsPrivacy')}
          </a>
          <div className="glassses">
            <img
              width={97.5}
              loading="lazy"
              {...t.attr('alt', 'footer.glassesAlt')}
              src="/wf/62fb7130b9491eced45079f8_sunglasses.webp"
              className="glasses-image"
            />
          </div>
          <p className="p">{t('footer.rights')}</p>
        </div>
      </footer>
    </>
  )
}
