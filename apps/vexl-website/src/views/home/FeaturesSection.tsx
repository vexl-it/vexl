'use client'

import {
  EyeShut,
  IconBox,
  Lock,
  OfferHandCash,
  PageSection,
  PeopleUsers,
  Typography,
  XStack,
  YStack,
  type IconProps,
} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {useTheme} from 'tamagui'
import {useLocale} from '../../components/LocaleProvider'

const featureIcons = {
  friends: PeopleUsers,
  marketplace: OfferHandCash,
  noData: Lock,
  anonymisation: EyeShut,
} as const satisfies Record<string, React.ComponentType<IconProps>>

const offerCards = [
  {src: '/images/card-drop01.webp', rotate: '-8deg'},
  {src: '/images/card-drop05.webp', rotate: '6deg'},
  {src: '/images/card-drop02.webp', rotate: '-3deg'},
  {src: '/images/card-drop06.webp', rotate: '9deg'},
  {src: '/images/card-drop07.webp', rotate: '-6deg'},
  {src: '/images/card-drop08.webp', rotate: '4deg'},
] as const

function OfferCardsStrip(): React.JSX.Element {
  return (
    <XStack
      aria-hidden
      flexWrap="wrap"
      justifyContent="center"
      gap="$5"
      paddingVertical="$7"
    >
      {offerCards.map((card) => (
        <Image
          key={card.src}
          src={card.src}
          alt=""
          width={272}
          height={69}
          style={{
            transform: `rotate(${card.rotate})`,
            maxWidth: '45%',
            height: 'auto',
          }}
        />
      ))}
    </XStack>
  )
}

export function FeaturesSection(): React.JSX.Element {
  const {t} = useLocale()
  const theme = useTheme()

  return (
    <PageSection>
      <OfferCardsStrip />
      <YStack
        gap="$5"
        $md={{flexDirection: 'row', flexWrap: 'wrap'}}
        $xl={{flexWrap: 'nowrap'}}
      >
        {(['friends', 'marketplace', 'noData', 'anonymisation'] as const).map(
          (key) => {
            const Icon = featureIcons[key]
            return (
              <YStack
                key={key}
                flex={1}
                minWidth={240}
                gap="$4"
                padding="$5"
                borderRadius="$5"
                backgroundColor="$backgroundSecondary"
              >
                <IconBox tone="accent">
                  <Icon size={24} color={theme.accentHighlightPrimary.get()} />
                </IconBox>
                <Typography
                  tag="h3"
                  variant="paragraphDemibold"
                  color="$foregroundPrimary"
                >
                  {t.home.features[key].title}
                </Typography>
                <Typography variant="description" color="$foregroundSecondary">
                  {t.home.features[key].text}
                </Typography>
              </YStack>
            )
          }
        )}
      </YStack>
    </PageSection>
  )
}
