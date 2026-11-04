'use client'

import {
  Button,
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
import React from 'react'
import {useTheme} from 'tamagui'
import {useLocale} from '../../components/LocaleProvider'
import {SiteLink} from '../../components/SiteLink'

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
    <XStack alignItems="center" gap="$4">
      <Icon size={24} color={iconColor} />
      <Typography variant="paragraphSmall" color={textColor}>
        {label}
      </Typography>
    </XStack>
  )
}

export function NoKycSection(): React.JSX.Element {
  const {t, path} = useLocale()
  const theme = useTheme()
  const copy = t.home.noKyc

  return (
    <PageSection>
      <Typography
        tag="h2"
        variant="display"
        color="$foregroundPrimary"
        textAlign="center"
      >
        {copy.title}
      </Typography>
      <YStack
        gap="$5"
        alignItems="stretch"
        $md={{flexDirection: 'row', alignItems: 'center'}}
      >
        <YStack
          flex={1}
          gap="$4"
          padding="$7"
          borderRadius="$5"
          backgroundColor="$backgroundSecondary"
        >
          <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
            {copy.everyExchange}
          </Typography>
          {exchangeAsks.map(({key, icon}) => (
            <AskRow
              key={key}
              icon={icon}
              label={copy.exchangeAsks[key]}
              iconColor={theme.foregroundTertiary.get()}
              textColor="$foregroundSecondary"
            />
          ))}
        </YStack>
        <YStack
          flex={1}
          gap="$4"
          padding="$7"
          borderRadius="$5"
          backgroundColor="$white100"
          theme="light"
        >
          <Typography variant="heading3" color="$black100">
            vexl:
          </Typography>
          {vexlAsks.map(({key, icon}) => (
            <AskRow
              key={key}
              icon={icon}
              label={copy.vexlAsks[key]}
              iconColor={tokens.color.black100.val}
              textColor="$black100"
            />
          ))}
          <XStack justifyContent="flex-end">
            <Image
              src="/images/kyc-avatar.webp"
              alt=""
              width={120}
              height={160}
            />
          </XStack>
          <ChatBubble text={copy.message} isMine={false} />
          <SiteLink href={path('/download')}>
            <Button role="none">{t.downloadVexl}</Button>
          </SiteLink>
        </YStack>
      </YStack>
    </PageSection>
  )
}
