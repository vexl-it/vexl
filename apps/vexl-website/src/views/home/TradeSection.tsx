'use client'

import {Button, PageSection, Typography, XStack, YStack} from '@vexl-next/ui'
import React, {useEffect, useRef, useState} from 'react'
import {useLocale} from '../../components/LocaleProvider'
import {NativeButton} from '../../components/NativeButton'
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
  const shownStep = useRef(step)
  const stepIndex = steps.indexOf(step)

  // A tap inside the phone swaps its screen and drops the focused control
  useEffect(() => {
    if (shownStep.current === step) return
    shownStep.current = step
    if (document.activeElement === document.body)
      focusFirstControl(screenRef.current)
  }, [step])

  const nextStep = steps[stepIndex + 1]

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
          setStep('offer')
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

  return (
    <PageSection
      id="how-it-works"
      $lg={{flexDirection: 'row', alignItems: 'center', gap: '$9'}}
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
        <YStack gap="$2">
          {steps.map((key, i) => (
            <StepItem
              key={key}
              number={i + 1}
              title={copy.steps[key].title}
              text={copy.steps[key].text}
              active={key === step}
              onPress={() => {
                setStep(key)
              }}
            />
          ))}
        </YStack>
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
                  setStep(key)
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
          {nextStep ? (
            <Button
              size="medium"
              variant="secondary"
              onPress={() => {
                setStep(nextStep)
              }}
            >
              {copy.next}
            </Button>
          ) : (
            <XStack gap="$3">
              <Button size="medium" variant="secondary" onPress={restart}>
                {copy.restart}
              </Button>
              <SiteLink href={path('/download')}>
                <Button role="none" size="medium">
                  {t.downloadVexl}
                </Button>
              </SiteLink>
            </XStack>
          )}
        </XStack>
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
            outlineStyle="none"
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
          {formatMessage(copy.stepAnnouncement, {
            step: stepIndex + 1,
            total: steps.length,
            title: stepTitle,
          })}
        </Typography>
      </XStack>
    </PageSection>
  )
}
