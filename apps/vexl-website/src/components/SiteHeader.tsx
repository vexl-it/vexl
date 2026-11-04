'use client'

import {
  BulletListMenu,
  Button,
  Language,
  NavButton,
  PAGE_SECTION_MAX_WIDTH,
  Typography,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import Image from 'next/image'
import {usePathname} from 'next/navigation'
import React, {useState} from 'react'
import {useTheme} from 'tamagui'
import {externalLinks} from '../config/links'
import {localizedPath, otherLocale} from '../i18n/locales'
import {useLocale} from './LocaleProvider'
import {SiteLink} from './SiteLink'

function useNavItems(): ReadonlyArray<{
  readonly label: string
  readonly href: string
}> {
  const {t, path} = useLocale()
  return [
    {label: t.nav.community, href: path('/community')},
    {label: t.nav.blog, href: path('/blog')},
    {label: t.nav.faq, href: path('/faq')},
    {label: t.nav.foundation, href: externalLinks.foundation},
    {label: t.nav.leaderboard, href: externalLinks.leaderboard},
  ]
}

function useOtherLanguageHref(): string {
  const {locale} = useLocale()
  const pathname = usePathname()
  const pathWithoutLocale =
    locale === 'en'
      ? pathname
      : pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'
  return localizedPath(otherLocale(locale), pathWithoutLocale)
}

function LanguageLink(): React.JSX.Element {
  const {t} = useLocale()
  const theme = useTheme()
  return (
    <SiteLink href={useOtherLanguageHref()}>
      <XStack
        role="none"
        alignItems="center"
        gap="$2"
        hoverStyle={{opacity: 0.7}}
      >
        <Language size={20} color={theme.foregroundPrimary.get()} />
        <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
          {t.nav.otherLanguage}
        </Typography>
      </XStack>
    </SiteLink>
  )
}

export function SiteHeader(): React.JSX.Element {
  const {t, path} = useLocale()
  const navItems = useNavItems()
  const pathname = usePathname()
  // Remembering where the menu was opened closes it after navigating away
  const [menuOpenedAt, setMenuOpenedAt] = useState<string | null>(null)
  const menuOpen = menuOpenedAt === pathname

  return (
    <YStack
      tag="header"
      backgroundColor="$backgroundPrimary"
      $platform-web={{position: 'sticky'}}
      top={0}
      zIndex="$5"
    >
      <XStack
        width="100%"
        maxWidth={PAGE_SECTION_MAX_WIDTH}
        alignSelf="center"
        alignItems="center"
        justifyContent="space-between"
        gap="$5"
        paddingHorizontal="$5"
        paddingVertical="$4"
        $lg={{paddingHorizontal: '$9'}}
      >
        <SiteLink href={path('/')} label="Vexl">
          <Image
            src="/images/vexl-logo.webp"
            alt="Vexl"
            width={98}
            height={30}
            priority
          />
        </SiteLink>
        <XStack tag="nav" display="none" gap="$7" $lg={{display: 'flex'}}>
          {navItems.map((item) => (
            <SiteLink key={item.href} href={item.href}>
              <Typography
                variant="paragraphSmallBold"
                color="$foregroundPrimary"
                hoverStyle={{color: '$accentYellowPrimary'}}
              >
                {item.label}
              </Typography>
            </SiteLink>
          ))}
        </XStack>
        <XStack alignItems="center" gap="$5">
          <XStack display="none" $lg={{display: 'flex'}}>
            <LanguageLink />
          </XStack>
          <SiteLink href={path('/download')}>
            <Button role="none" size="small" variant="primary">
              {t.nav.download}
            </Button>
          </SiteLink>
          <NavButton
            $lg={{display: 'none'}}
            icon={menuOpen ? XmarkCancelClose : BulletListMenu}
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
            aria-expanded={menuOpen}
            onPress={() => {
              setMenuOpenedAt(menuOpen ? null : pathname)
            }}
          />
        </XStack>
      </XStack>
      {menuOpen ? (
        <YStack
          tag="nav"
          gap="$5"
          paddingHorizontal="$5"
          paddingBottom="$7"
          $lg={{display: 'none'}}
        >
          {navItems.map((item) => (
            <SiteLink key={item.href} href={item.href}>
              <Typography variant="titlesSmall" color="$foregroundPrimary">
                {item.label}
              </Typography>
            </SiteLink>
          ))}
          <LanguageLink />
        </YStack>
      ) : null}
    </YStack>
  )
}
