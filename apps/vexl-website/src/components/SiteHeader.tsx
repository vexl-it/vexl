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
import {locales, localizedPath, otherLocale} from '../i18n/locales'
import {useLocale} from './LocaleProvider'
import {SiteLink} from './SiteLink'

interface NavItem {
  readonly label: string
  readonly href: string
  readonly current: boolean
}

// Prerendering sees the internal /en route, the browser the public URL
const localePrefix = new RegExp(`^/(${locales.join('|')})(?=/|$)`)

function usePathWithoutLocale(): string {
  return usePathname().replace(localePrefix, '') || '/'
}

function useNavItems(): readonly NavItem[] {
  const {t, path} = useLocale()
  const pathWithoutLocale = usePathWithoutLocale()
  // A blog post lives under /post, so it highlights the blog too
  const section = pathWithoutLocale.startsWith('/post/')
    ? '/blog'
    : pathWithoutLocale
  const isIn = (prefix: string): boolean =>
    section === prefix || section.startsWith(`${prefix}/`)

  return [
    {
      label: t.nav.howItWorks,
      href: `${path('/')}#how-it-works`,
      current: false,
    },
    {
      label: t.nav.community,
      href: path('/community'),
      current: isIn('/community'),
    },
    {label: t.nav.blog, href: path('/blog'), current: isIn('/blog')},
    {label: t.nav.faq, href: path('/faq'), current: isIn('/faq')},
  ]
}

function useOtherLanguageHref(): string {
  const {locale} = useLocale()
  return localizedPath(otherLocale(locale), usePathWithoutLocale())
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
            <SiteLink key={item.href} href={item.href} current={item.current}>
              <Typography
                variant="paragraphSmallBold"
                color={
                  item.current ? '$accentYellowPrimary' : '$foregroundPrimary'
                }
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
          position="absolute"
          top="100%"
          left={0}
          right={0}
          height="100svh"
          gap="$7"
          paddingHorizontal="$5"
          paddingTop="$8"
          borderTopWidth={1}
          borderColor="$backgroundTertiary"
          backgroundColor="$backgroundPrimary"
          $lg={{display: 'none'}}
        >
          {navItems.map((item) => (
            <SiteLink
              key={item.href}
              href={item.href}
              current={item.current}
              // Same-page anchors don't change the pathname that closes the menu
              onPress={() => {
                setMenuOpenedAt(null)
              }}
            >
              <Typography
                variant="heading3"
                color={
                  item.current ? '$accentYellowPrimary' : '$foregroundPrimary'
                }
              >
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
