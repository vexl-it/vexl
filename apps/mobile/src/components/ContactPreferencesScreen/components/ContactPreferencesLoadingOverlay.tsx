import {Loader, Stack, Typography, YStack} from '@vexl-next/ui'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'

export default function ContactPreferencesLoadingOverlay({
  visible,
}: {
  readonly visible: boolean
}): React.ReactElement | null {
  const {t} = useTranslation()

  if (!visible) return null

  return (
    <Stack
      pos="absolute"
      t={0}
      r={0}
      b={0}
      l={0}
      zIndex={100}
      ai="center"
      jc="center"
      pointerEvents="auto"
    >
      <Stack
        pos="absolute"
        t={0}
        r={0}
        b={0}
        l={0}
        bg="$backgroundPrimary"
        opacity={0.78}
      />
      <YStack
        ai="center"
        gap="$3"
        bg="$backgroundSecondary"
        br="$5"
        px="$5"
        py="$4"
      >
        <Loader size="medium" />
        <Typography color="$foregroundPrimary" variant="paragraphSmall">
          {t('contacts.preparingContacts')}
        </Typography>
      </YStack>
    </Stack>
  )
}
