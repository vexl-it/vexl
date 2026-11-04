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
} from '@vexl-next/ui'
import Image from 'next/image'
import React, {useEffect, useRef, useState} from 'react'
import {useTheme} from 'tamagui'
import {useLocale} from '../../components/LocaleProvider'

const STRIKE_STAGGER_MS = 140

// Vexl asks for a phone number too, so that one isn't struck through
const exchangeAsks = [
  {key: 'name', icon: UserProfile, vexlAsksToo: false},
  {key: 'phone', icon: PhoneCall, vexlAsksToo: true},
  {key: 'selfie', icon: Camera, vexlAsksToo: false},
  {key: 'card', icon: EuroCurrency, vexlAsksToo: false},
  {key: 'address', icon: PinGeolocation, vexlAsksToo: false},
  {key: 'email', icon: Send, vexlAsksToo: false},
  {key: 'bank', icon: MoneyBankNotes, vexlAsksToo: false},
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
            {exchangeAsks.map(({key, icon: Icon, vexlAsksToo}, i) => (
              <XStack
                key={key}
                tag="li"
                position="relative"
                alignSelf="flex-start"
                alignItems="center"
                gap="$4"
              >
                <Icon size={24} color={theme.foregroundTertiary.get()} />
                <Typography
                  variant="paragraphSmall"
                  color="$foregroundSecondary"
                >
                  {copy.exchangeAsks[key]}
                </Typography>
                {vexlAsksToo ? null : (
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
                )}
              </XStack>
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
          <XStack alignItems="center" gap="$3">
            <YStack flexShrink={0}>
              <PhoneCall size={32} color={tokens.color.black100.val} />
            </YStack>
            <Typography tag="p" variant="heading2" color="$black100">
              {copy.vexlAsk}
            </Typography>
          </XStack>
          <XStack flex={1} alignItems="flex-end" gap="$4">
            <YStack flex={1}>
              <ChatBubble text={copy.message} isMine={false} />
            </YStack>
            <YStack width={72} flexShrink={0} $lg={{width: 120}}>
              <Image
                src="/images/kyc-avatar.webp"
                alt=""
                width={120}
                height={160}
                style={{width: '100%', height: 'auto'}}
              />
            </YStack>
          </XStack>
        </YStack>
      </YStack>
    </PageSection>
  )
}
