import {Array} from 'effect'
import React from 'react'
import {ArrowIcon} from '../../components/ArrowIcon'
import {type CopyKey} from '../../copy/copyFiles'
import {type PageCopy} from '../../copy/pageCopy'

const footerLinks = [
  {
    href: 'https://donate.vexl.foundation/',
    icon: '/wf/646235c8ed1d35a7b5247bb0_Donate.webp',
    iconWidth: 32,
    title: 'footer.donate.title',
    text: 'footer.donate.text',
  },
  {
    href: 'https://mobile.twitter.com/vexl',
    icon: '/wf/6786e4ffcec3f9320521b1ad_65fc4ba248aadc1248a0e743_X-logo.svg',
    iconWidth: 32,
    title: 'footer.x.title',
    text: 'footer.x.text',
  },
  {
    href: 'https://njump.me/npub1mftv2j67vayavkks8rqev3u8jjhefe86tf80msstfxvpunk9vmps6prkl3',
    icon: '/wf/678e29c211674a12b6434615_Sni-mek_obrazovky_2025-01-20_v_11.31.46-removebg-preview-1.png',
    iconWidth: 32,
    title: 'footer.nostr.title',
    text: 'footer.nostr.text',
  },
  {
    href: 'https://vexl.it/brand',
    icon: '/wf/64623cf0bb7a7b00aee45610_press-kit.svg',
    title: 'footer.brandManual.title',
    text: 'footer.brandManual.text',
  },
] satisfies ReadonlyArray<{
  readonly href: string
  readonly icon: string
  readonly iconWidth?: number
  readonly title: CopyKey<'home'>
  readonly text: CopyKey<'home'>
}>

export function Footer({t}: {readonly t: PageCopy<'home'>}): React.JSX.Element {
  return (
    <>
      <div className="container is-footer-links">
        {Array.map(footerLinks, (link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="footer-box_wrap w-inline-block"
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
              <p className="p3">{t(link.text)}</p>
            </div>
          </a>
        ))}
        <div className="footer-box_wrap">
          <div className="footer-icon_wrap">
            <img
              src="/wf/646235c8ed1d35a7b5247bae_Flag.webp"
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
            <div className="footer-content_wrap">
              <p className="p3">
                {t('footer.contact.text')}
                <br />
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="footer">
        <div className="container is-footer-icon">
          <div className="glassses footer">
            <img
              src="/wf/646214c4363076eb171c33e1_sunglasses.webp"
              loading="lazy"
              width={97.5}
              alt=""
              className="glasses-image"
            />
          </div>
          <p className="p3">{t('footer.copyright')}</p>
        </div>
      </div>
      <p className="p3 footer-privacy">{t('footer.privacy')}</p>
    </>
  )
}
