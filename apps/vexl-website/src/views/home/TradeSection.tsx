'use client'

import {Button, PageSection, Typography, XStack, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'
import {useLocale} from '../../components/LocaleProvider'
import {NativeButton} from '../../components/NativeButton'
import {PhoneFrame} from '../../components/PhoneFrame'
import {formatMessage} from '../../i18n/locales'
import {
  ChatScreen,
  FriendsScreen,
  OfferScreen,
  RevealScreen,
} from './mock/TradeScreens'

const steps = ['offer', 'friends', 'chat', 'reveal'] as const
type Step = (typeof steps)[number]

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
    >
      <XStack gap="$4">
        <YStack
          width="$8"
          height="$8"
          borderRadius="$11"
          alignItems="center"
          justifyContent="center"
          backgroundColor={
            active ? '$accentYellowPrimary' : '$backgroundTertiary'
          }
        >
          <Typography
            variant="paragraphSmallBold"
            color={active ? '$black100' : '$foregroundSecondary'}
          >
            {number}
          </Typography>
        </YStack>
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
  const {t} = useLocale()
  const copy = t.home.trade
  const [step, setStep] = useState<Step>('offer')
  // Bumped on restart so the screens drop their own state
  const [run, setRun] = useState(0)
  const stepIndex = steps.indexOf(step)
  const nextStep = steps[stepIndex + 1]

  const restart = (): void => {
    setRun((value) => value + 1)
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
        onMessage={() => {
          setStep('chat')
        }}
      />
    ),
    chat: (
      <ChatScreen
        onReveal={() => {
          setStep('reveal')
        }}
      />
    ),
    reveal: <RevealScreen />,
  }[step]

  return (
    <PageSection id="how-it-works">
      <YStack gap="$4" maxWidth={760}>
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
      <YStack gap="$7" $lg={{flexDirection: 'row-reverse', gap: '$9'}}>
        <XStack
          flex={1}
          justifyContent="center"
          paddingVertical="$9"
          borderRadius="$8"
          backgroundColor="$backgroundSecondary"
          $lg={{flexBasis: 0}}
        >
          <PhoneFrame label={t.home.mock.label}>
            <YStack key={`${step}-${run}`} flex={1} className="vexl-enter">
              {screen}
            </YStack>
          </PhoneFrame>
        </XStack>
        <YStack flex={1} gap="$2" justifyContent="center" $lg={{flexBasis: 0}}>
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
          <XStack
            alignItems="center"
            justifyContent="space-between"
            gap="$5"
            paddingTop="$5"
            paddingHorizontal="$5"
          >
            <Typography variant="description" color="$foregroundTertiary">
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
              <Button size="medium" variant="secondary" onPress={restart}>
                {copy.restart}
              </Button>
            )}
          </XStack>
        </YStack>
      </YStack>
    </PageSection>
  )
}
