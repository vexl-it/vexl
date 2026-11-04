'use client'

import {PageSection, Typography, YStack} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {type ColorTokens} from 'tamagui'
import {useLocale} from '../../components/LocaleProvider'

interface StepStyle {
  readonly image: string
  readonly width: number
  readonly height: number
  readonly background: ColorTokens
  readonly onDark: boolean
}

// Fixed brand colors: the cards look the same in both themes
const stepStyles = {
  contacts: {
    image: '/images/how-1.webp',
    width: 773,
    height: 800,
    background: '$greenLight',
    onDark: false,
  },
  offers: {
    image: '/images/how-2.webp',
    width: 800,
    height: 752,
    background: '$pinkLight',
    onDark: false,
  },
  chat: {
    image: '/images/how-3.webp',
    width: 800,
    height: 670,
    background: '$yellow100',
    onDark: false,
  },
  trade: {
    image: '/images/how-4.webp',
    width: 800,
    height: 662,
    background: '$greenDark',
    onDark: true,
  },
} as const satisfies Record<string, StepStyle>

export function HowItWorksSection(): React.JSX.Element {
  const {t} = useLocale()
  const steps = t.home.howItWorks.steps

  return (
    <PageSection>
      <Typography tag="h2" variant="display" color="$foregroundPrimary">
        {t.home.howItWorks.title}
      </Typography>
      <YStack
        gap="$5"
        $md={{flexDirection: 'row', flexWrap: 'wrap'}}
        $xl={{flexWrap: 'nowrap'}}
      >
        {(['contacts', 'offers', 'chat', 'trade'] as const).map(
          (key, index) => {
            const style = stepStyles[key]
            const textColor = style.onDark ? '$white100' : '$black100'
            return (
              <YStack
                key={key}
                flex={1}
                minWidth={240}
                gap="$5"
                padding="$5"
                borderRadius="$5"
                backgroundColor={style.background}
              >
                <Image
                  src={style.image}
                  alt=""
                  width={style.width}
                  height={style.height}
                  sizes="(min-width: 1024px) 280px, 90vw"
                  style={{width: '100%', height: 'auto'}}
                />
                <YStack gap="$3">
                  <Typography
                    tag="h3"
                    variant="paragraphDemibold"
                    color={textColor}
                  >
                    {`${index + 1}. ${steps[key].title}`}
                  </Typography>
                  <Typography
                    variant="description"
                    color={textColor}
                    opacity={0.8}
                  >
                    {steps[key].text}
                  </Typography>
                </YStack>
              </YStack>
            )
          }
        )}
      </YStack>
    </PageSection>
  )
}
