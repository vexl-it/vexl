'use client'

import {Button, PageSection, Typography, XStack, YStack} from '@vexl-next/ui'
import {media} from '@vexl-next/ui/src/config/media'
import React, {useEffect, useRef, useState} from 'react'
import {useLocale} from '../../components/LocaleProvider'
import {focusRing, NativeButton} from '../../components/NativeButton'
import {PhoneFrame} from '../../components/PhoneFrame'
import {SiteLink} from '../../components/SiteLink'
import {focusFirstControl} from '../../components/focusFirstControl'
import {formatMessage} from '../../i18n/locales'
import {
  ChatScreen,
  FriendsScreen,
  OfferScreen,
  RevealScreen,
  type RevealChoice,
} from './mock/TradeScreens'

const steps = ['offer', 'friends', 'chat', 'reveal'] as const

/**
 * Sent by the hero's offers. Its detail is 'friends' for the featured offer,
 * which the walkthrough opens; other offers start the walkthrough over.
 */
export const OPEN_DEMO_EVENT = 'vexl:open-demo'

// Sticky header height plus a little air, as in globals.css scroll-margin-top
const HEADER_OFFSET = 88
// For browsers without the scrollend event
const SCROLL_SETTLE_MS = 900
type Step = (typeof steps)[number]

function StepNumber({
  number,
  active,
}: {
  readonly number: number
  readonly active: boolean
}): React.JSX.Element {
  return (
    <YStack
      width="$8"
      height="$8"
      borderRadius="$11"
      alignItems="center"
      justifyContent="center"
      backgroundColor={active ? '$accentYellowPrimary' : '$backgroundTertiary'}
    >
      <Typography
        variant="paragraphSmallBold"
        color={active ? '$black100' : '$foregroundSecondary'}
      >
        {number}
      </Typography>
    </YStack>
  )
}

function StepItem({
  number,
  title,
  text,
  active,
  onPress,
}: {
  readonly number: number
  readonly title: string
  readonly text: string
  readonly active: boolean
  readonly onPress: () => void
}): React.JSX.Element {
  return (
    <NativeButton
      current={active ? 'step' : undefined}
      onPress={onPress}
      padding="$5"
      borderRadius="$5"
      backgroundColor={active ? '$backgroundSecondary' : '$transparent'}
      hoverStyle={{backgroundColor: '$backgroundSecondary'}}
      // Phones show only the current step, next to the phone mock
      display={active ? 'flex' : 'none'}
      $lg={{display: 'flex'}}
    >
      <XStack gap="$4">
        <StepNumber number={number} active={active} />
        <YStack flex={1} gap="$3" paddingTop="$1">
          <Typography
            variant="titlesSmall"
            color={active ? '$foregroundPrimary' : '$foregroundSecondary'}
          >
            {title}
          </Typography>
          {active ? (
            <Typography
              className="vexl-enter"
              variant="paragraphSmall"
              color="$foregroundSecondary"
            >
              {text}
            </Typography>
          ) : null}
        </YStack>
      </XStack>
    </NativeButton>
  )
}

export function TradeSection(): React.JSX.Element {
  const {t, path} = useLocale()
  const copy = t.home.trade
  const [step, setStep] = useState<Step>('offer')
  // Bumped on restart so the screens drop their own state
  const [run, setRun] = useState(0)
  const [revealChoice, setRevealChoice] = useState<RevealChoice>('undecided')
  const screenRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const shownStep = useRef(step)
  const stepIndex = steps.indexOf(step)

  // A tap inside the phone swaps its screen and drops the focused control
  useEffect(() => {
    if (shownStep.current === step) return
    shownStep.current = step
    if (document.activeElement === document.body)
      focusFirstControl(screenRef.current)
  }, [step])

  useEffect(() => {
    const open = (event: Event): void => {
      const featured =
        event instanceof CustomEvent && event.detail === 'friends'
      setRun((value) => value + 1)
      setRevealChoice('undecided')
      setStep(featured ? 'friends' : 'offer')
      // Phones show the step text right above the mock: once the link's own
      // scroll to the section heading ends, move on to the step text
      if (!window.matchMedia(`(min-width: ${media.lg.minWidth}px)`).matches) {
        const showStepCard = (): void => {
          clearTimeout(fallback)
          window.removeEventListener('scrollend', showStepCard)
          const card = stepsRef.current?.querySelector('[aria-current="step"]')
          if (!card) return
          window.scrollTo({
            top:
              card.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET,
          })
        }
        const fallback = setTimeout(showStepCard, SCROLL_SETTLE_MS)
        window.addEventListener('scrollend', showStepCard)
      }
    }
    window.addEventListener(OPEN_DEMO_EVENT, open)
    return () => {
      window.removeEventListener(OPEN_DEMO_EVENT, open)
    }
  }, [])

  const nextStep = steps[stepIndex + 1]

  // A decision only exists on the reveal step; leaving it starts the chat over
  const goTo = (target: Step): void => {
    if (target !== 'reveal') setRevealChoice('undecided')
    setStep(target)
  }

  const restart = (): void => {
    setRun((value) => value + 1)
    setRevealChoice('undecided')
    setStep('offer')
  }

  const screen = {
    offer: (
      <OfferScreen
        onOpenOffer={() => {
          setStep('friends')
        }}
      />
    ),
    friends: (
      <FriendsScreen
        onBack={() => {
          goTo('offer')
        }}
        onRequest={() => {
          setStep('chat')
        }}
      />
    ),
    chat: (
      <ChatScreen
        onChoose={(choice) => {
          setRevealChoice(choice)
          setStep('reveal')
        }}
      />
    ),
    reveal: <RevealScreen choice={revealChoice} onChoose={setRevealChoice} />,
  }[step]

  const stepTitle = copy.steps[step].title
  const outcome =
    step === 'reveal' && revealChoice !== 'undecided'
      ? copy.screens[revealChoice === 'revealed' ? 'revealed' : 'declined']
      : undefined

  // Desktop shows these under the steps, phones under the mock
  const controls = (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      gap="$5"
      paddingHorizontal="$5"
    >
      <XStack gap="$2" $lg={{display: 'none'}}>
        {steps.map((key, i) => (
          <NativeButton
            key={key}
            label={copy.steps[key].title}
            current={key === step ? 'step' : undefined}
            onPress={() => {
              goTo(key)
            }}
            borderRadius="$11"
          >
            <StepNumber number={i + 1} active={key === step} />
          </NativeButton>
        ))}
      </XStack>
      <Typography
        display="none"
        $lg={{display: 'flex'}}
        variant="description"
        color="$foregroundTertiary"
      >
        {formatMessage(copy.stepOf, {
          step: stepIndex + 1,
          total: steps.length,
        })}
      </Typography>
      {/* One button stays mounted here, so keyboard focus survives the last step */}
      <XStack gap="$3">
        <Button
          size="medium"
          variant="secondary"
          onPress={() => {
            if (nextStep) goTo(nextStep)
            else restart()
          }}
        >
          {nextStep ? copy.next : copy.restart}
        </Button>
        {nextStep ? null : (
          <SiteLink href={path('/download')}>
            <Button role="none" size="medium">
              {t.downloadVexl}
            </Button>
          </SiteLink>
        )}
      </XStack>
    </XStack>
  )

  return (
    <PageSection
      id="how-it-works"
      $lg={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: '$9',
        paddingTop: '$9',
      }}
    >
      <YStack flex={1} gap="$7" $lg={{flexBasis: 0}}>
        <YStack gap="$4">
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
        <YStack ref={stepsRef} gap="$2">
          {steps.map((key, i) => (
            <StepItem
              key={key}
              number={i + 1}
              title={copy.steps[key].title}
              text={copy.steps[key].text}
              active={key === step}
              onPress={() => {
                goTo(key)
              }}
            />
          ))}
        </YStack>
        <YStack display="none" $lg={{display: 'flex'}}>
          {controls}
        </YStack>
      </YStack>
      <XStack
        flex={1}
        justifyContent="center"
        paddingVertical="$5"
        borderRadius="$8"
        backgroundColor="$backgroundSecondary"
        $md={{paddingVertical: '$7'}}
        $lg={{flexBasis: 0}}
      >
        <PhoneFrame label={t.home.mock.label}>
          <YStack
            key={`${step}-${run}`}
            ref={screenRef}
            role="group"
            tabIndex={-1}
            aria-label={stepTitle}
            flex={1}
            className="vexl-enter"
            focusVisibleStyle={focusRing}
          >
            {screen}
          </YStack>
        </PhoneFrame>
        <Typography
          variant="description"
          color="$foregroundPrimary"
          aria-live="polite"
          className="vexl-visually-hidden"
        >
          {[
            formatMessage(copy.stepAnnouncement, {
              step: stepIndex + 1,
              total: steps.length,
              title: stepTitle,
            }),
            outcome,
          ].join(outcome ? '. ' : '')}
        </Typography>
      </XStack>
      <YStack $lg={{display: 'none'}}>{controls}</YStack>
    </PageSection>
  )
}
