'use client'

import {
  Divider,
  PAGE_SECTION_MAX_WIDTH,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {externalLinks} from '../config/links'
import {formatMessage} from '../i18n/locales'
import {useLocale} from './LocaleProvider'
import {SiteLink} from './SiteLink'

interface FooterLink {
  readonly label: string
  readonly href: string
}

function FooterColumn({
  title,
  children,
}: {
  readonly title: string
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <YStack tag="nav" aria-label={title} gap="$4" minWidth={140}>
      <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
        {title}
      </Typography>
      {children}
    </YStack>
  )
}

function FooterLinks({
  title,
  links,
}: {
  readonly title: string
  readonly links: readonly FooterLink[]
}): React.JSX.Element {
  return (
    <FooterColumn title={title}>
      {links.map((link) => (
        <SiteLink key={link.href} href={link.href}>
          <Typography
            variant="paragraphSmall"
            color="$foregroundSecondary"
            hoverStyle={{color: '$foregroundPrimary'}}
          >
            {link.label}
          </Typography>
        </SiteLink>
      ))}
    </FooterColumn>
  )
}

export function SiteFooter(): React.JSX.Element {
  const {t, path} = useLocale()
  const copy = t.footer

  return (
    <YStack
      tag="footer"
      width="100%"
      maxWidth={PAGE_SECTION_MAX_WIDTH}
      alignSelf="center"
      gap="$9"
      paddingHorizontal="$5"
      paddingTop="$10"
      paddingBottom="$9"
      $lg={{paddingHorizontal: '$9'}}
    >
      <YStack gap="$9" $lg={{flexDirection: 'row'}}>
        <YStack gap="$5" maxWidth={320} $lg={{flex: 1}}>
          <Image
            src="/images/vexl-logo.webp"
            alt="Vexl"
            width={98}
            height={30}
          />
          <Typography variant="paragraphSmall" color="$foregroundSecondary">
            {copy.tagline}
          </Typography>
        </YStack>
        <XStack flexWrap="wrap" gap="$9" rowGap="$8" $lg={{flex: 2}}>
          <FooterLinks
            title={copy.explore}
            links={[
              {label: t.nav.download, href: path('/download')},
              {label: t.nav.howItWorks, href: `${path('/')}#how-it-works`},
              {label: t.nav.community, href: path('/community')},
              {label: t.nav.blog, href: path('/blog')},
              {label: t.nav.faq, href: path('/faq')},
            ]}
          />
          <FooterLinks
            title={copy.about}
            links={[
              {label: copy.foundation, href: externalLinks.foundation},
              {label: copy.github, href: externalLinks.github},
              {label: copy.audit, href: path('/audit')},
              {label: copy.leaderboard, href: externalLinks.leaderboard},
              {label: copy.brand, href: externalLinks.brandManual},
            ]}
          />
          <FooterLinks
            title={copy.follow}
            links={[
              {label: copy.youtube, href: externalLinks.youtube},
              {label: copy.x, href: externalLinks.x},
              {label: copy.nostr, href: externalLinks.nostr},
            ]}
          />
          <FooterColumn title={copy.contact.title}>
            <YStack gap="$1">
              {copy.contact.lines.map((line) => (
                <Typography
                  key={line}
                  variant="paragraphSmall"
                  color="$foregroundSecondary"
                >
                  {line}
                </Typography>
              ))}
            </YStack>
            <SiteLink href={externalLinks.supportEmail}>
              <Typography
                variant="paragraphSmall"
                color="$foregroundPrimary"
                hoverStyle={{color: '$accentYellowPrimary'}}
              >
                {copy.contact.email}
              </Typography>
            </SiteLink>
          </FooterColumn>
        </XStack>
      </YStack>
      <Divider />
      <XStack
        alignItems="center"
        justifyContent="space-between"
        gap="$5"
        flexWrap="wrap"
      >
        <SiteLink href={path('/terms-privacy')}>
          <Typography
            variant="description"
            color="$foregroundSecondary"
            hoverStyle={{color: '$foregroundPrimary'}}
          >
            {copy.terms}
          </Typography>
        </SiteLink>
        <Image src="/images/glasses-white.webp" alt="" width={44} height={20} />
        <Typography variant="description" color="$foregroundSecondary">
          {formatMessage(copy.rights, {year: new Date().getFullYear()})}
        </Typography>
      </XStack>
    </YStack>
  )
}
