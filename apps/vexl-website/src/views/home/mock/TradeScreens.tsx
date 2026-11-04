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
import React, {useEffect, useRef, useState} from 'react'
import {focusFirstControl} from '../../../components/focusFirstControl'
import {useLocale} from '../../../components/LocaleProvider'
import {focusRing, NativeButton} from '../../../components/NativeButton'
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
      <YStack gap="$2" paddingHorizontal="$2">
        <Typography variant="heading3" color="$foregroundPrimary">
          {t.home.mock.marketplace}
        </Typography>
        <Typography variant="description" color="$accentYellowPrimary">
          {t.home.trade.screens.tapHint}
        </Typography>
      </YStack>
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
          label={featured?.commonFriends ?? ''}
          trustedLabel={
            featured && 'trusted' in featured ? featured.trusted : undefined
          }
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

export type RevealChoice = 'undecided' | 'revealed' | 'declined'

/**
 * Moves keyboard focus here when the control that had it disappeared, on
 * mount and whenever `shownFor` changes.
 */
function useTakeOrphanedFocus(
  shownFor?: string
): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (document.activeElement === document.body) focusFirstControl(ref.current)
  }, [shownFor])
  return ref
}

function RevealRequestCard({
  onChoose,
}: {
  readonly onChoose: (choice: RevealChoice) => void
}): React.JSX.Element {
  const {t} = useLocale()
  const screens = t.home.trade.screens
  const focusRef = useTakeOrphanedFocus()

  return (
    <YStack
      ref={focusRef}
      role="group"
      tabIndex={-1}
      aria-label={screens.theyWant}
      focusVisibleStyle={focusRing}
      className="vexl-enter"
    >
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
              onChoose('declined')
            }}
          >
            {screens.noThanks}
          </Button>
          <Button
            flex={1}
            size="medium"
            onPress={() => {
              onChoose('revealed')
            }}
          >
            {screens.agree}
          </Button>
        </XStack>
      </BotMessageCard>
    </YStack>
  )
}

/** The conversation so far, shared by the chat and reveal screens. */
function ChatHistory({
  replied,
}: {
  readonly replied: boolean
}): React.JSX.Element {
  const {t} = useLocale()
  const screens = t.home.trade.screens
  return (
    <>
      <ChatBubble
        text={screens.firstMessage}
        isMine
        header={{label: screens.requestHeader}}
      />
      <BotMessageCard
        senderLabel={screens.vexlbot}
        statusLabel={screens.accepted}
        statusVariant="accepted"
        title={screens.requestAccepted}
      />
      <ChatBubble text={screens.theirReply} isMine={false} />
      {replied ? (
        <>
          <Message text={screens.quickReply} isMine />
          <Message text={screens.theirFollowUp} isMine={false} />
        </>
      ) : null}
    </>
  )
}

export function ChatScreen({
  onChoose,
}: {
  readonly onChoose: (choice: RevealChoice) => void
}): React.JSX.Element {
  const {t} = useLocale()
  const screens = t.home.trade.screens
  const [replied, setReplied] = useState(false)

  return (
    <YStack flex={1}>
      <ChatHeader revealed={false} />
      <ChatBody>
        <ChatHistory replied={replied} />
        {replied ? <RevealRequestCard onChoose={onChoose} /> : null}
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

function RevealedCard(): React.JSX.Element {
  const {t} = useLocale()
  const screens = t.home.trade.screens
  return (
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
  )
}

export function RevealScreen({
  choice,
  onChoose,
}: {
  readonly choice: RevealChoice
  readonly onChoose: (choice: RevealChoice) => void
}): React.JSX.Element {
  const {t} = useLocale()
  const screens = t.home.trade.screens
  const outcomeFocusRef = useTakeOrphanedFocus(choice)

  return (
    <YStack flex={1}>
      <ChatHeader revealed={choice === 'revealed'} />
      <ChatBody>
        <ChatHistory replied />
        {choice === 'undecided' ? (
          <RevealRequestCard onChoose={onChoose} />
        ) : (
          <>
            <YStack
              ref={outcomeFocusRef}
              role="group"
              tabIndex={-1}
              aria-label={
                choice === 'revealed' ? screens.revealed : screens.declined
              }
              focusVisibleStyle={focusRing}
              className="vexl-enter"
            >
              {choice === 'revealed' ? (
                <RevealedCard />
              ) : (
                <BotMessageCard
                  senderLabel={screens.vexlbot}
                  title={screens.declined}
                  description={screens.nothingRevealed}
                  muted
                />
              )}
            </YStack>
            <Message
              text={
                choice === 'revealed'
                  ? screens.lastMessage
                  : screens.anonymousLastMessage
              }
              isMine={false}
            />
          </>
        )}
      </ChatBody>
    </YStack>
  )
}
