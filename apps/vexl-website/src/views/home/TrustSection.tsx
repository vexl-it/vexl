'use client'

import {
  ArrowRight,
  Checklist,
  IconBox,
  LogConsole,
  PageSection,
  PeopleUsers,
  Typography,
  XStack,
  YStack,
  type IconProps,
} from '@vexl-next/ui'
import React from 'react'
import {useTheme} from 'tamagui'
import {useLocale} from '../../components/LocaleProvider'
import {Photo} from '../../components/Photo'
import {SiteLink} from '../../components/SiteLink'
import {externalLinks} from '../../config/links'

function TrustTile({
  href,
  icon: Icon,
  title,
  text,
  action,
}: {
  readonly href: string
  readonly icon: React.ComponentType<IconProps>
  readonly title: string
  readonly text: string
  readonly action: string
}): React.JSX.Element {
  const theme = useTheme()
  return (
    <SiteLink href={href} fill>
      <YStack
        role="none"
        flex={1}
        gap="$5"
        padding="$7"
        borderRadius="$8"
        backgroundColor="$backgroundSecondary"
        hoverStyle={{backgroundColor: '$backgroundTertiary'}}
      >
        <IconBox tone="accent">
          <Icon size={24} color={theme.accentHighlightPrimary.get()} />
        </IconBox>
        <YStack flex={1} gap="$3">
          <Typography tag="h3" variant="titles" color="$foregroundPrimary">
            {title}
          </Typography>
          <Typography variant="paragraphSmall" color="$foregroundSecondary">
            {text}
          </Typography>
        </YStack>
        <XStack alignItems="center" gap="$2">
          <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
            {action}
          </Typography>
          <ArrowRight size={18} color={theme.accentYellowPrimary.get()} />
        </XStack>
      </YStack>
    </SiteLink>
  )
}

export function TrustSection(): React.JSX.Element {
  const {t, path} = useLocale()
  const copy = t.home.trust

  return (
    <PageSection>
      <YStack gap="$5" maxWidth={820}>
        <Typography variant="paragraphSmallBold" color="$accentYellowPrimary">
          {copy.eyebrow}
        </Typography>
        <Typography tag="h2" variant="display" color="$foregroundPrimary">
          {copy.title}
        </Typography>
        <Typography variant="paragraph" color="$foregroundSecondary">
          {copy.text}
        </Typography>
      </YStack>
      <Photo
        photo="team"
        alt={copy.teamPhoto}
        sizes="(min-width: 1200px) 1120px, 100vw"
        aspectRatio={2.2}
      />
      <YStack gap="$5" $md={{flexDirection: 'row'}}>
        <TrustTile
          href={externalLinks.github}
          icon={LogConsole}
          {...copy.openSource}
        />
        <TrustTile href={path('/audit')} icon={Checklist} {...copy.audit} />
        <TrustTile
          href={externalLinks.foundation}
          icon={PeopleUsers}
          {...copy.foundation}
        />
      </YStack>
    </PageSection>
  )
}
