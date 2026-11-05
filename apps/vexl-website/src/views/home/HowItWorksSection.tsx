'use client'

import {
  BotMessageCard,
  ChatBubble,
  ExchangeRevealCard,
  FriendLevel,
  PageSection,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import React from 'react'
import {Theme} from 'tamagui'
import {DownloadCta} from '../../components/DownloadCta'
import {useLocale} from '../../components/LocaleProvider'
import {RevealedAvatar} from './mock/DemoAvatar'
import {DemoOfferCard} from './mock/DemoOfferCard'

function ContactsMock(): React.JSX.Element {
  const {t} = useLocale()
  const copy = t.home.howItWorks.mocks
  return (
    <YStack alignItems="center">
      <FriendLevel degree="ALL" selected title={copy.friendsOfFriends} />
    </YStack>
  )
}

function OfferMock(): React.JSX.Element {
  const {t} = useLocale()
  const [featured] = t.home.mock.offers
  return featured ? <DemoOfferCard offer={featured} avatar={0} /> : <></>
}

function ChatMock(): React.JSX.Element {
  const {t} = useLocale()
  const copy = t.home.howItWorks.mocks
  return (
    <YStack gap="$3">
      <ChatBubble
        text={copy.request}
        isMine
        header={{label: copy.requestHeader}}
      />
      <BotMessageCard
        senderLabel={copy.vexlbot}
        statusLabel={copy.accepted}
        statusVariant="accepted"
        title={copy.requestAccepted}
      />
      <ChatBubble text={copy.reply} isMine={false} />
    </YStack>
  )
}

function RevealMock(): React.JSX.Element {
  const {t} = useLocale()
  const copy = t.home.howItWorks.mocks
  return (
    <YStack gap="$3">
      <ExchangeRevealCard
        title={copy.revealed}
        leftSide={{
          avatar: <RevealedAvatar who="you" size={56} />,
          name: copy.you,
        }}
        rightSide={{
          avatar: <RevealedAvatar who="them" size={56} />,
          name: copy.theirName,
        }}
      />
      <ChatBubble text={copy.lastMessage} isMine={false} />
    </YStack>
  )
}

const steps = [
  {key: 'contacts', color: '$greenLight', theme: 'light', Mock: ContactsMock},
  {key: 'offer', color: '$pinkLight', theme: 'light', Mock: OfferMock},
  {key: 'chat', color: '$yellow100', theme: 'light', Mock: ChatMock},
  {key: 'trade', color: '$greenDark', theme: 'dark', Mock: RevealMock},
] as const

function StepCard({
  number,
  step,
}: {
  readonly number: number
  readonly step: (typeof steps)[number]
}): React.JSX.Element {
  const {t} = useLocale()
  const copy = t.home.howItWorks.steps[step.key]
  const textColor = step.theme === 'dark' ? '$white100' : '$black100'

  return (
    <YStack
      tag="li"
      width="100%"
      borderRadius="$8"
      overflow="hidden"
      backgroundColor={step.color}
      $md={{width: 'calc(50% - 8px)'}}
      $xl={{flexDirection: 'row-reverse', alignItems: 'stretch'}}
    >
      {/* App screens are pictures here; the step text says what they show */}
      <Theme name={step.theme}>
        <YStack
          aria-hidden
          pointerEvents="none"
          minHeight={240}
          justifyContent="center"
          paddingHorizontal="$5"
          paddingTop="$7"
          $xl={{width: 320, paddingVertical: '$7', paddingLeft: 0}}
        >
          <step.Mock />
        </YStack>
      </Theme>
      <YStack
        flex={1}
        gap="$3"
        padding="$7"
        paddingTop="$5"
        $xl={{justifyContent: 'flex-end', paddingTop: '$7'}}
      >
        <Typography variant="titlesSmall" color={textColor} opacity={0.5}>
          {number}
        </Typography>
        <Typography tag="h3" variant="titlesSmall" color={textColor}>
          {copy.title}
        </Typography>
        <Typography variant="paragraphSmall" color={textColor}>
          {copy.text}
        </Typography>
      </YStack>
    </YStack>
  )
}

export function HowItWorksSection(): React.JSX.Element {
  const {t} = useLocale()
  const copy = t.home.howItWorks

  return (
    <PageSection id="how-it-works" $lg={{paddingTop: '$9'}}>
      <YStack gap="$4" maxWidth={720}>
        <Typography variant="paragraphSmallBold" color="$accentYellowPrimary">
          {copy.eyebrow}
        </Typography>
        <Typography tag="h2" variant="heading1" color="$foregroundPrimary">
          {copy.title}
        </Typography>
        <Typography variant="paragraph" color="$foregroundSecondary">
          {copy.text}
        </Typography>
      </YStack>
      <XStack tag="ol" flexWrap="wrap" gap="$5" margin={0} padding={0}>
        {steps.map((step, i) => (
          <StepCard key={step.key} number={i + 1} step={step} />
        ))}
      </XStack>
      <XStack
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap="$5"
      >
        <Typography variant="description" color="$foregroundTertiary">
          {copy.caption}
        </Typography>
        <DownloadCta />
      </XStack>
    </PageSection>
  )
}
