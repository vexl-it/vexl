'use client'

import {
  Camera,
  ChatBubble,
  EuroCurrency,
  MoneyBankNotes,
  PageSection,
  PhoneCall,
  PinGeolocation,
  Send,
  tokens,
  Typography,
  UserProfile,
  XStack,
  YStack,
  type IconProps,
} from '@vexl-next/ui'
import Image from 'next/image'
import React, {useEffect, useRef, useState} from 'react'
import {useTheme} from 'tamagui'
import {useLocale} from '../../components/LocaleProvider'

const STRIKE_STAGGER_MS = 140

const exchangeAsks = [
  {key: 'name', icon: UserProfile},
  {key: 'phone', icon: PhoneCall},
  {key: 'selfie', icon: Camera},
  {key: 'card', icon: EuroCurrency},
  {key: 'address', icon: PinGeolocation},
  {key: 'email', icon: Send},
  {key: 'bank', icon: MoneyBankNotes},
] as const

const vexlAsks = [
  {key: 'nickname', icon: UserProfile},
  {key: 'phone', icon: PhoneCall},
] as const

/** True once the element has scrolled into view. */
function useSeen<T extends Element>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setSeen(true)
        observer.disconnect()
      },
      {threshold: 0.4}
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [])

  return [ref, seen]
}

function AskRow({
  icon: Icon,
  label,
  iconColor,
  textColor,
}: {
  readonly icon: React.ComponentType<IconProps>
  readonly label: string
  readonly iconColor: string
  readonly textColor: '$foregroundSecondary' | '$black100'
}): React.JSX.Element {
  return (
    <XStack tag="li" alignItems="center" gap="$4">
      <Icon size={24} color={iconColor} />
      <Typography variant="paragraphSmall" color={textColor}>
        {label}
      </Typography>
    </XStack>
  )
}

export function NoKycSection(): React.JSX.Element {
  const {t} = useLocale()
  const theme = useTheme()
  const copy = t.home.noKyc
  const [listRef, listSeen] = useSeen<HTMLDivElement>()

  return (
    <PageSection>
      <YStack gap="$5" maxWidth={820}>
        <Typography tag="h2" variant="display" color="$foregroundPrimary">
          {copy.title}
        </Typography>
        <Typography variant="paragraph" color="$foregroundSecondary">
          {copy.text}
        </Typography>
      </YStack>
      <YStack gap="$5" $md={{flexDirection: 'row'}}>
        <YStack
          ref={listRef}
          className={listSeen ? 'vexl-in-view' : undefined}
          flex={1}
          gap="$5"
          padding="$7"
          borderRadius="$8"
          backgroundColor="$backgroundSecondary"
          $md={{flexBasis: 0}}
        >
          <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
            {copy.exchangeTitle}
          </Typography>
          <YStack tag="ul" gap="$4" margin={0} padding={0}>
            {exchangeAsks.map(({key, icon}, i) => (
              <YStack key={key} position="relative" alignSelf="flex-start">
                <AskRow
                  icon={icon}
                  label={copy.exchangeAsks[key]}
                  iconColor={theme.foregroundTertiary.get()}
                  textColor="$foregroundSecondary"
                />
                <YStack
                  aria-hidden
                  className="vexl-strike-line"
                  position="absolute"
                  left={0}
                  right={0}
                  top="50%"
                  height={2}
                  backgroundColor="$redLight"
                  style={{transitionDelay: `${i * STRIKE_STAGGER_MS}ms`}}
                />
              </YStack>
            ))}
          </YStack>
        </YStack>
        <YStack
          flex={1}
          gap="$5"
          padding="$7"
          borderRadius="$8"
          backgroundColor="$accentYellowPrimary"
          $md={{flexBasis: 0}}
        >
          <Typography variant="paragraphSmallBold" color="$black100">
            {copy.vexlTitle}
          </Typography>
          <YStack tag="ul" gap="$4" margin={0} padding={0}>
            {vexlAsks.map(({key, icon}) => (
              <AskRow
                key={key}
                icon={icon}
                label={copy.vexlAsks[key]}
                iconColor={tokens.color.black100.val}
                textColor="$black100"
              />
            ))}
          </YStack>
          <XStack flex={1} alignItems="flex-end" gap="$4">
            <YStack flex={1}>
              <ChatBubble text={copy.message} isMine={false} />
            </YStack>
            <Image
              src="/images/kyc-avatar.webp"
              alt=""
              width={90}
              height={120}
            />
          </XStack>
        </YStack>
      </YStack>
    </PageSection>
  )
}
