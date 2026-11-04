'use client'

import {
  ArrowRight,
  Button,
  tokens,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import Image from 'next/image'
import React from 'react'
import {useTheme} from 'tamagui'
import {useLocale} from './LocaleProvider'
import {SiteLink} from './SiteLink'

/** QR code on wide screens, a download button on phones. */
export function DownloadCta({
  tone = 'dark',
}: {
  readonly tone?: 'dark' | 'light'
}): React.JSX.Element {
  const {t, path} = useLocale()
  const theme = useTheme()
  const textColor = tone === 'dark' ? '$foregroundPrimary' : '$black100'

  return (
    <SiteLink href={path('/download')}>
      <XStack
        role="none"
        display="none"
        alignItems="center"
        gap="$5"
        hoverStyle={{opacity: 0.8}}
        $lg={{display: 'flex'}}
      >
        <YStack backgroundColor="$white100" padding="$2" borderRadius="$3">
          <Image src="/images/download-qr.webp" alt="" width={88} height={88} />
        </YStack>
        <YStack gap="$3" maxWidth={180}>
          <Typography variant="paragraphSmallBold" color={textColor}>
            {t.scanToDownload}
          </Typography>
          <ArrowRight
            size={24}
            color={
              tone === 'dark'
                ? theme.accentYellowPrimary.get()
                : tokens.color.black100.val
            }
          />
        </YStack>
      </XStack>
      <XStack $lg={{display: 'none'}}>
        <Button role="none" variant={tone === 'dark' ? 'primary' : 'secondary'}>
          {t.downloadVexl}
        </Button>
      </XStack>
    </SiteLink>
  )
}
