'use client'

import {
  ArrowLeft,
  BotMessageCard,
  Button,
  ChatBubble,
  CommonFriends,
  ExchangeRevealCard,
  NavigationBar,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React, {useEffect, useState} from 'react'
import {useLocale} from '../../../components/LocaleProvider'
import {NativeButton} from '../../../components/NativeButton'
import {DemoAvatar} from './DemoAvatar'
import {DemoOfferCard} from './DemoOfferCard'

const REVEAL_ANSWER_DELAY_MS = 1600
const ANONYMOUS_AVATAR = 0
const REVEALED_AVATAR = 4

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
  onMessage,
}: {
  readonly onBack: () => void
  readonly onMessage: () => void
}): React.JSX.Element {
  const {t} = useLocale()
  const screens = t.home.trade.screens
  const [featured] = t.home.mock.offers

  return (
    <YStack flex={1}>
      <NavigationBar
        style="back"
        title={screens.offerTitle}
        leftAction={{icon: ArrowLeft, onPress: onBack}}
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
        <Button onPress={onMessage}>{screens.sendMessage}</Button>
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
        <DemoAvatar
          index={revealed ? REVEALED_AVATAR : ANONYMOUS_AVATAR}
          size={40}
        />
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
      <YStack flex={1} justifyContent="flex-end" gap="$3" padding="$3">
        <Message text={screens.firstMessage} isMine />
        <Message text={screens.theirReply} isMine={false} />
        {replied ? (
          <>
            <Message text={screens.quickReply} isMine />
            <Message text={screens.theirFollowUp} isMine={false} />
          </>
        ) : null}
      </YStack>
      <YStack padding="$3">
        {replied ? (
          <Button onPress={onReveal}>{screens.reveal}</Button>
        ) : (
          <Button
            variant="secondary"
            onPress={() => {
              setReplied(true)
            }}
          >
            {screens.quickReply}
          </Button>
        )}
      </YStack>
    </YStack>
  )
}

export function RevealScreen(): React.JSX.Element {
  const {t} = useLocale()
  const screens = t.home.trade.screens
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAgreed(true)
    }, REVEAL_ANSWER_DELAY_MS)
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  return (
    <YStack flex={1}>
      <ChatHeader revealed={agreed} />
      <YStack flex={1} justifyContent="flex-end" gap="$3" padding="$3">
        <ChatBubble text={screens.quickReply} isMine />
        <ChatBubble text={screens.theirFollowUp} isMine={false} />
        {agreed ? (
          <>
            <YStack className="vexl-enter">
              <ExchangeRevealCard
                title={screens.revealed}
                description={screens.bothRevealed}
                leftSide={{
                  avatar: <DemoAvatar index={3} size={64} />,
                  name: screens.you,
                }}
                rightSide={{
                  avatar: <DemoAvatar index={REVEALED_AVATAR} size={64} />,
                  name: screens.theirName,
                }}
              />
            </YStack>
            <Message text={screens.lastMessage} isMine={false} />
          </>
        ) : (
          <YStack className="vexl-enter">
            <BotMessageCard
              senderLabel={screens.vexlbot}
              statusLabel={screens.pending}
              title={screens.youAsked}
              details={[screens.detailsHidden]}
            />
          </YStack>
        )}
      </YStack>
    </YStack>
  )
}
