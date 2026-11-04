'use client'

import {
  ArrowRight,
  Book,
  FlagReport,
  PAGE_SECTION_MAX_WIDTH,
  Typography,
  XStack,
  XTwitter,
  YStack,
  type IconProps,
} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {useTheme} from 'tamagui'
import {externalLinks} from '../config/links'
import {formatMessage} from '../i18n/locales'
import {useLocale} from './LocaleProvider'
import {SiteLink} from './SiteLink'

const ICON_SIZE = 28

function ImageIcon({src}: {readonly src: string}): React.JSX.Element {
  return (
    <Image
      src={src}
      alt=""
      width={ICON_SIZE}
      height={ICON_SIZE}
      style={{objectFit: 'contain'}}
    />
  )
}

function UiIcon({
  icon: Icon,
}: {
  readonly icon: React.ComponentType<IconProps>
}): React.JSX.Element {
  const theme = useTheme()
  return <Icon size={ICON_SIZE} color={theme.foregroundPrimary.get()} />
}

function FooterCard({
  href,
  icon,
  title,
  children,
}: {
  readonly href?: string
  readonly icon: React.ReactNode
  readonly title: string
  readonly children: React.ReactNode
}): React.JSX.Element {
  const theme = useTheme()
  const card = (
    <YStack
      role="none"
      flex={1}
      minWidth={200}
      minHeight={200}
      justifyContent="space-between"
      gap="$5"
      padding="$5"
      borderRadius="$5"
      backgroundColor="$backgroundSecondary"
      hoverStyle={href ? {backgroundColor: '$backgroundTertiary'} : undefined}
    >
      {icon}
      <YStack gap="$2">
        <XStack alignItems="center" gap="$2">
          <Typography variant="paragraphDemibold" color="$foregroundPrimary">
            {title}
          </Typography>
          {href ? (
            <ArrowRight size={18} color={theme.foregroundSecondary.get()} />
          ) : null}
        </XStack>
        {children}
      </YStack>
    </YStack>
  )
  return href ? (
    <SiteLink href={href} fill>
      {card}
    </SiteLink>
  ) : (
    <YStack flex={1} $md={{flexBasis: 0}}>
      {card}
    </YStack>
  )
}

function FooterText({
  children,
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <Typography variant="description" color="$foregroundSecondary">
      {children}
    </Typography>
  )
}

export function SiteFooter(): React.JSX.Element {
  const {t, path} = useLocale()

  return (
    <YStack
      tag="footer"
      width="100%"
      maxWidth={PAGE_SECTION_MAX_WIDTH}
      alignSelf="center"
      gap="$7"
      paddingHorizontal="$5"
      paddingVertical="$9"
      $lg={{paddingHorizontal: '$9'}}
    >
      <YStack
        gap="$3"
        $md={{flexDirection: 'row', flexWrap: 'wrap'}}
        $lg={{flexWrap: 'nowrap'}}
      >
        <FooterCard
          href={externalLinks.youtube}
          icon={<ImageIcon src="/images/social-youtube.svg" />}
          title={t.footer.youtube.title}
        >
          <FooterText>{t.footer.youtube.text}</FooterText>
        </FooterCard>
        <FooterCard
          href={externalLinks.x}
          icon={<UiIcon icon={XTwitter} />}
          title={t.footer.x.title}
        >
          <FooterText>{t.footer.x.text}</FooterText>
        </FooterCard>
        <FooterCard
          href={externalLinks.nostr}
          icon={<ImageIcon src="/images/social-nostr.webp" />}
          title={t.footer.nostr.title}
        >
          <FooterText>{t.footer.nostr.text}</FooterText>
        </FooterCard>
        <FooterCard
          href={externalLinks.brandManual}
          icon={<UiIcon icon={Book} />}
          title={t.footer.brand.title}
        >
          <FooterText>{t.footer.brand.text}</FooterText>
        </FooterCard>
        <FooterCard
          icon={<UiIcon icon={FlagReport} />}
          title={t.footer.contact.title}
        >
          <YStack>
            {t.footer.contact.lines.map((line) => (
              <FooterText key={line}>{line}</FooterText>
            ))}
            <SiteLink href={externalLinks.supportEmail} inline>
              <FooterText>{t.footer.contact.email}</FooterText>
            </SiteLink>
          </YStack>
        </FooterCard>
      </YStack>
      <XStack
        alignItems="center"
        justifyContent="space-between"
        gap="$5"
        flexWrap="wrap"
      >
        <SiteLink href={path('/terms-privacy')}>
          <Typography
            variant="description"
            color="$foregroundPrimary"
            hoverStyle={{opacity: 0.7}}
          >
            {t.footer.terms}
          </Typography>
        </SiteLink>
        <Image src="/images/glasses-white.webp" alt="" width={44} height={20} />
        <Typography variant="description" color="$foregroundSecondary">
          {formatMessage(t.footer.rights, {year: new Date().getFullYear()})}
        </Typography>
      </XStack>
    </YStack>
  )
}
