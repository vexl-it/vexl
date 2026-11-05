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
import React from 'react'
import {useTheme} from 'tamagui'
import {useLocale} from '../../components/LocaleProvider'

const exchangeAsks = [
  {key: 'name', icon: UserProfile},
  {key: 'phone', icon: PhoneCall},
  {key: 'selfie', icon: Camera},
  {key: 'card', icon: EuroCurrency},
  {key: 'address', icon: PinGeolocation},
  {key: 'email', icon: Send},
  {key: 'bank', icon: MoneyBankNotes},
] as const

export function NoKycSection(): React.JSX.Element {
  const {t} = useLocale()
  const theme = useTheme()
  const copy = t.home.noKyc

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
            {exchangeAsks.map(({key, icon: Icon}) => (
              <XStack key={key} tag="li" alignItems="center" gap="$4">
                <Icon size={24} color={theme.foregroundSecondary.get()} />
                <Typography variant="paragraphSmall" color="$foregroundPrimary">
                  {copy.exchangeAsks[key]}
                </Typography>
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
