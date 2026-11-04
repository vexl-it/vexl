'use client'

import {
  ArrowLeft,
  BotMessageCard,
  Button,
  ChatBubble,
  CommonFriends,
  ExchangeRevealCard,
  NavigationBar,
  ScrollView,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React, {useRef, useState} from 'react'
import {useLocale} from '../../../components/LocaleProvider'
import {NativeButton} from '../../../components/NativeButton'
import {DemoAvatar, RevealedAvatar} from './DemoAvatar'
import {DemoOfferCard} from './DemoOfferCard'

const ANONYMOUS_AVATAR = 0

export function OfferScreen({
  onOpenOffer,
}: {
  readonly onOpenOffer: () => void
}): React.JSX.Element {
  const {t} = useLocale()
  const [featured, other] = t.home.mock.offers

  return (
    <YStack gap="$5" paddingTop="$7" paddingHorizontal="$3">
      <Typography
        variant="heading3"
        color="$foregroundPrimary"
        paddingHorizontal="$2"
      >
        {t.home.mock.marketplace}
      </Typography>
      {featured ? (
        <NativeButton
          onPress={onOpenOffer}
          borderRadius="$5"
          className="vexl-pulse"
          pressStyle={{opacity: 0.7}}
        >
          <DemoOfferCard offer={featured} avatar={0} />
        </NativeButton>
      ) : null}
      {other ? (
        <YStack opacity={0.4} aria-hidden>
          <DemoOfferCard offer={other} avatar={2} />
        </YStack>
      ) : null}
      <Typography
        variant="description"
        color="$accentYellowPrimary"
        textAlign="center"
      >
        {t.home.trade.screens.tapHint}
      </Typography>
    </YStack>
  )
}

export function FriendsScreen({
  onBack,
  onRequest,
}: {
  readonly onBack: () => void
  readonly onRequest: () => void
}): React.JSX.Element {
  const {t} = useLocale()
  const screens = t.home.trade.screens
  const [featured] = t.home.mock.offers

  return (
    <YStack flex={1}>
      <NavigationBar
        style="back"
        title={screens.offerTitle}
        leftAction={{
          icon: ArrowLeft,
          onPress: onBack,
          accessibilityLabel: screens.back,
        }}
      />
      <YStack flex={1} gap="$5" paddingHorizontal="$3" paddingTop="$3">
        {featured ? <DemoOfferCard offer={featured} avatar={0} /> : null}
        <Typography
          variant="description"
          color="$foregroundSecondary"
          paddingHorizontal="$2"
        >
          {screens.connection}
        </Typography>
        <CommonFriends
          label={screens.commonFriends}
          trustedLabel={screens.trustedLabel}
          friends={pipe(
            screens.friends,
            Array.map((name, i) => ({id: name, name, trusted: i === 0}))
          )}
        />
      </YStack>
      <YStack padding="$3">
        <Button onPress={onRequest}>{screens.sendRequest}</Button>
      </YStack>
    </YStack>
  )
}

function ChatHeader({
  revealed,
}: {
  readonly revealed: boolean
}): React.JSX.Element {
  const {t} = useLocale()
  const [featured] = t.home.mock.offers
  return (
    <NavigationBar
      style="chat"
      name={
        revealed ? t.home.trade.screens.theirName : t.home.mock.friendOfFriend
      }
      subtitle={featured?.commonFriends}
      avatar={
        revealed ? (
          <YStack className="vexl-enter">
            <RevealedAvatar
              name={t.home.trade.screens.theirName}
              size={40}
              backgroundColor="$pinkBackground"
            />
          </YStack>
        ) : (
          <DemoAvatar index={ANONYMOUS_AVATAR} size={40} />
        )
      }
    />
  )
}

function Message({
  text,
  isMine,
}: {
  readonly text: string
  readonly isMine: boolean
}): React.JSX.Element {
  return (
    <YStack className="vexl-enter">
      <ChatBubble text={text} isMine={isMine} />
    </YStack>
  )
}

/** Scrolls to the latest message, like a chat does. */
function ChatBody({
  children,
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null)
  return (
    <ScrollView
      ref={scrollRef}
      flex={1}
      contentContainerStyle={{flexGrow: 1, justifyContent: 'flex-end'}}
      onContentSizeChange={() => {
        scrollRef.current?.scrollToEnd({animated: false})
      }}
    >
      <YStack gap="$3" padding="$3">
        {children}
      </YStack>
    </ScrollView>
  )
}

type RevealChoice = 'undecided' | 'declined'

function RevealRequestCard({
  onReveal,
}: {
  readonly onReveal: () => void
}): React.JSX.Element {
  const {t} = useLocale()
  const screens = t.home.trade.screens
  const [choice, setChoice] = useState<RevealChoice>('undecided')

  if (choice === 'declined')
    return (
      <YStack className="vexl-enter">
        <BotMessageCard
          senderLabel={screens.vexlbot}
          title={screens.declined}
          description={screens.nothingRevealed}
          muted
        />
      </YStack>
    )

  return (
    <YStack className="vexl-enter">
      <BotMessageCard
        senderLabel={screens.vexlbot}
        statusLabel={screens.reactionRequired}
        title={screens.theyWant}
        details={[screens.sameDetails]}
      >
        <XStack gap="$3" width="100%">
          <Button
            flex={1}
            size="medium"
            variant="secondary"
            onPress={() => {
              setChoice('declined')
            }}
          >
            {screens.noThanks}
          </Button>
          <Button flex={1} size="medium" onPress={onReveal}>
            {screens.agree}
          </Button>
        </XStack>
      </BotMessageCard>
    </YStack>
  )
}

export function ChatScreen({
  onReveal,
}: {
  readonly onReveal: () => void
}): React.JSX.Element {
  const {t} = useLocale()
  const screens = t.home.trade.screens
  const [replied, setReplied] = useState(false)

  return (
    <YStack flex={1}>
      <ChatHeader revealed={false} />
      <ChatBody>
        <Message text={screens.firstMessage} isMine />
        <BotMessageCard
          senderLabel={screens.vexlbot}
          statusLabel={screens.accepted}
          statusVariant="accepted"
          title={screens.requestAccepted}
        />
        <Message text={screens.theirReply} isMine={false} />
        {replied ? (
          <>
            <Message text={screens.quickReply} isMine />
            <Message text={screens.theirFollowUp} isMine={false} />
            <RevealRequestCard onReveal={onReveal} />
          </>
        ) : null}
      </ChatBody>
      {replied ? null : (
        <YStack padding="$3">
          <Button
            variant="secondary"
            onPress={() => {
              setReplied(true)
            }}
          >
            {screens.quickReply}
          </Button>
        </YStack>
      )}
    </YStack>
  )
}

export function RevealScreen(): React.JSX.Element {
  const {t} = useLocale()
  const screens = t.home.trade.screens

  return (
    <YStack flex={1}>
      <ChatHeader revealed />
      <ChatBody>
        <ChatBubble text={screens.quickReply} isMine />
        <ChatBubble text={screens.theirFollowUp} isMine={false} />
        <YStack className="vexl-enter">
          <ExchangeRevealCard
            title={screens.revealed}
            description={screens.bothRevealed}
            leftSide={{
              avatar: (
                <RevealedAvatar
                  name={screens.you}
                  size={64}
                  backgroundColor="$greenBackground"
                />
              ),
              name: screens.you,
            }}
            rightSide={{
              avatar: (
                <RevealedAvatar
                  name={screens.theirName}
                  size={64}
                  backgroundColor="$pinkBackground"
                />
              ),
              name: screens.theirName,
            }}
          />
        </YStack>
        <Message text={screens.lastMessage} isMine={false} />
      </ChatBody>
    </YStack>
  )
}
