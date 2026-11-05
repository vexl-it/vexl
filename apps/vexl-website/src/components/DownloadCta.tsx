'use client'

import {Button, QrCodeFrame, Typography, XStack, YStack} from '@vexl-next/ui'
import React from 'react'
import {externalLinks} from '../config/links'
import {useLocale} from './LocaleProvider'
import {SiteLink} from './SiteLink'

const QR_SIZE = 88

/** QR code on wide screens, a download button on phones. */
export function DownloadCta({
  onYellow = false,
}: {
  readonly onYellow?: boolean
}): React.JSX.Element {
  const {t, path} = useLocale()

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
        <YStack
          padding="$2"
          borderRadius="$4"
          borderWidth={onYellow ? 0 : 1}
          borderColor="$backgroundTertiary"
          backgroundColor="$white100"
        >
          <QrCodeFrame value={externalLinks.downloadPage} size={QR_SIZE} />
        </YStack>
        <Typography
          variant="paragraphSmallBold"
          color={onYellow ? '$black100' : '$foregroundPrimary'}
          maxWidth={160}
        >
          {t.scanToDownload}
        </Typography>
      </XStack>
      <XStack $lg={{display: 'none'}}>
        <Button role="none" variant={onYellow ? 'tertiary' : 'primary'}>
          {t.downloadVexl}
        </Button>
      </XStack>
    </SiteLink>
  )
}
