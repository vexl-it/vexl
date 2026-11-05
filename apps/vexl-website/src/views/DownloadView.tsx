'use client'

import {
  ArrowRight,
  Button,
  LinkTile,
  PageSection,
  QuestionmarkCircle,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {useTheme} from 'tamagui'
import {useLocale} from '../components/LocaleProvider'
import {SiteLink} from '../components/SiteLink'
import {externalLinks} from '../config/links'

function CardIcon({logo}: {readonly logo: string}): React.JSX.Element {
  return (
    <YStack
      width="$9"
      height="$9"
      borderRadius="$11"
      backgroundColor="$backgroundTertiary"
      alignItems="center"
      justifyContent="center"
    >
      <Image src={logo} alt="" width={20} height={20} />
    </YStack>
  )
}

function DownloadCard({
  id,
  logo,
  title,
  subtitle,
  action,
  children,
}: {
  readonly id?: string
  readonly logo: string
  readonly title: string
  readonly subtitle: string
  readonly action?: React.ReactNode
  readonly children?: React.ReactNode
}): React.JSX.Element {
  return (
    <YStack
      id={id}
      gap="$5"
      padding="$5"
      borderRadius="$5"
      backgroundColor="$backgroundSecondary"
      style={{scrollMarginTop: 96}}
      $md={{padding: '$7'}}
    >
      <XStack alignItems="center" gap="$4" flexWrap="wrap">
        <CardIcon logo={logo} />
        <YStack flex={1} minWidth={200} gap="$1">
          <Typography tag="h2" variant="titles" color="$foregroundPrimary">
            {title}
          </Typography>
          <Typography variant="paragraphSmall" color="$foregroundSecondary">
            {subtitle}
          </Typography>
        </YStack>
        {action}
      </XStack>
      {children}
    </YStack>
  )
}

function ActionButton({
  href,
  label,
}: {
  readonly href: string
  readonly label: string
}): React.JSX.Element {
  return (
    <SiteLink href={href}>
      <Button role="none" size="medium" icon={ArrowRight}>
        {label}
      </Button>
    </SiteLink>
  )
}

interface Step {
  readonly title: string
  readonly text: string
  readonly emphasis?: string
  readonly action?: {readonly href: string; readonly label: string}
}

function StepRow({
  number,
  step,
}: {
  readonly number: number
  readonly step: Step
}): React.JSX.Element {
  return (
    <XStack
      gap="$4"
      paddingTop="$5"
      borderTopWidth={1}
      borderColor="$backgroundTertiary"
    >
      <YStack
        width="$8"
        height="$8"
        borderRadius="$11"
        backgroundColor="$accentYellowPrimary"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="paragraphSmallBold" color="$black100">
          {String(number)}
        </Typography>
      </YStack>
      <YStack flex={1} gap="$2" alignItems="flex-start">
        <Typography
          tag="h3"
          variant="paragraphDemibold"
          color="$foregroundPrimary"
        >
          {step.title}
        </Typography>
        <Typography variant="paragraphSmall" color="$foregroundSecondary">
          {step.text}
          {step.emphasis ? (
            <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
              {` ${step.emphasis}`}
            </Typography>
          ) : null}
        </Typography>
        {step.action ? <ActionButton {...step.action} /> : null}
      </YStack>
    </XStack>
  )
}

function StoreLink({
  href,
  logo,
  label,
}: {
  readonly href: string
  readonly logo: string
  readonly label: string
}): React.JSX.Element {
  return (
    <SiteLink href={href}>
      <LinkTile
        label={label}
        leading={<Image src={logo} alt="" width={20} height={20} />}
      />
    </SiteLink>
  )
}

function OptionGroup({
  title,
  text,
  children,
}: {
  readonly title: string
  readonly text: string
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <YStack gap="$3">
      <YStack gap="$1">
        <Typography
          tag="h3"
          variant="paragraphDemibold"
          color="$foregroundPrimary"
        >
          {title}
        </Typography>
        <Typography variant="description" color="$foregroundSecondary">
          {text}
        </Typography>
      </YStack>
      <XStack gap="$3" flexWrap="wrap">
        {children}
      </XStack>
    </YStack>
  )
}

function PlatformChip({
  href,
  logo,
  label,
}: {
  readonly href: string
  readonly logo: string
  readonly label: string
}): React.JSX.Element {
  return (
    <SiteLink href={href}>
      <XStack
        role="none"
        alignItems="center"
        gap="$3"
        paddingHorizontal="$5"
        height="$11"
        borderRadius="$5"
        backgroundColor="$backgroundSecondary"
        hoverStyle={{backgroundColor: '$backgroundTertiary'}}
      >
        <Image src={logo} alt="" width={20} height={20} />
        <Typography variant="paragraphDemibold" color="$foregroundPrimary">
          {label}
        </Typography>
      </XStack>
    </SiteLink>
  )
}

function useIosSteps(variant: 'eu' | 'nonEu'): readonly Step[] {
  const {t} = useLocale()
  if (variant === 'eu') {
    const steps = t.download.ios.steps
    return [
      {
        ...steps.altStore,
        action: {href: externalLinks.altStore, label: steps.altStore.action},
      },
      {
        ...steps.freedomStore,
        action: {
          href: externalLinks.freedomStoreSource,
          label: steps.freedomStore.action,
        },
      },
      steps.install,
    ]
  }
  const steps = t.download.iosNonEu.steps
  return [
    {
      ...steps.testFlight,
      action: {href: externalLinks.testFlight, label: steps.testFlight.action},
    },
    {
      ...steps.install,
      action: {
        href: externalLinks.testFlightInvite,
        label: steps.install.action,
      },
    },
  ]
}

export function DownloadView({
  variant,
}: {
  readonly variant: 'eu' | 'nonEu'
}): React.JSX.Element {
  const {t, path} = useLocale()
  const theme = useTheme()
  const copy = t.download
  const iosCopy = variant === 'eu' ? copy.ios : copy.iosNonEu
  const iosSteps = useIosSteps(variant)
  const regionSwitch =
    variant === 'eu'
      ? {
          question: copy.ios.outsideEu,
          label: copy.ios.viewInstructions,
          href: path('/download-noneu'),
        }
      : {
          question: copy.iosNonEu.inEu,
          label: copy.iosNonEu.viewEuInstructions,
          href: path('/download'),
        }

  return (
    <PageSection maxWidth={960} gap="$5">
      <XStack alignItems="center" justifyContent="space-between" gap="$7">
        <YStack flex={1} gap="$5">
          <Typography tag="h1" variant="display" color="$foregroundPrimary">
            {variant === 'eu' ? copy.title : copy.nonEuTitle}
          </Typography>
          <Typography variant="paragraph" color="$foregroundSecondary">
            {copy.intro}
          </Typography>
        </YStack>
        <XStack
          display="none"
          $lg={{display: 'flex'}}
          alignItems="center"
          gap="$5"
          padding="$5"
          borderRadius="$5"
          backgroundColor="$backgroundSecondary"
        >
          <YStack backgroundColor="$white100" padding="$2" borderRadius="$3">
            <Image
              src="/images/download-qr.webp"
              alt=""
              width={104}
              height={104}
            />
          </YStack>
          <YStack gap="$2" maxWidth={160}>
            <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
              {copy.qrTitle}
            </Typography>
            <Typography variant="description" color="$foregroundSecondary">
              {copy.qrText}
            </Typography>
          </YStack>
        </XStack>
      </XStack>
      <XStack gap="$3" flexWrap="wrap">
        <PlatformChip
          href="#iphone"
          logo="/images/platform-apple.svg"
          label={copy.iphone}
        />
        <PlatformChip
          href="#android"
          logo="/images/platform-android.svg"
          label={copy.android}
        />
      </XStack>

      <DownloadCard
        id="iphone"
        logo="/images/platform-apple.svg"
        title={iosCopy.title}
        subtitle={iosCopy.subtitle}
      >
        <XStack
          alignItems="center"
          gap="$3"
          padding="$4"
          borderRadius="$4"
          backgroundColor="$backgroundTertiary"
          flexWrap="wrap"
        >
          <QuestionmarkCircle size={20} color={theme.foregroundPrimary.get()} />
          <Typography variant="paragraphSmall" color="$foregroundPrimary">
            {regionSwitch.question}
          </Typography>
          <SiteLink href={regionSwitch.href}>
            <Typography
              variant="paragraphSmallBold"
              color="$accentYellowPrimary"
            >
              {regionSwitch.label}
            </Typography>
          </SiteLink>
        </XStack>
        {iosSteps.map((step, index) => (
          <StepRow key={step.title} number={index + 1} step={step} />
        ))}
      </DownloadCard>

      <DownloadCard
        id="android"
        logo="/images/platform-android.svg"
        title={copy.androidCard.title}
        subtitle={copy.androidCard.subtitle}
        action={
          <ActionButton
            href={externalLinks.googlePlay}
            label={copy.androidCard.googlePlay}
          />
        }
      />

      <DownloadCard
        logo="/images/platform-android.svg"
        title={copy.alternatives.title}
        subtitle={copy.alternatives.subtitle}
      >
        <OptionGroup
          title={copy.alternatives.storesTitle}
          text={copy.alternatives.storesText}
        >
          <StoreLink
            href={externalLinks.auroraStore}
            logo="/images/store-aurora.svg"
            label="Aurora Store"
          />
          <StoreLink
            href={externalLinks.zapstore}
            logo="/images/store-zapstore.svg"
            label="Zapstore"
          />
        </OptionGroup>
        <OptionGroup
          title={copy.alternatives.otherWaysTitle}
          text={copy.alternatives.otherWaysText}
        >
          <StoreLink
            href={externalLinks.githubReleases}
            logo="/images/store-github.svg"
            label="GitHub Releases (APK)"
          />
          <StoreLink
            href={externalLinks.obtainium}
            logo="/images/store-obtainium.svg"
            label="Obtainium"
          />
        </OptionGroup>
      </DownloadCard>
    </PageSection>
  )
}
