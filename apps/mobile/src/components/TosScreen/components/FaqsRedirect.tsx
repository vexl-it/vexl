import {Play, Stack, Typography, useTheme, XStack} from '@vexl-next/ui'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'

interface Props {
  onPress: () => void
}

function FaqsRedirect({onPress}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()

  return (
    <XStack
      alignItems="center"
      backgroundColor="$navigationBackground"
      borderRadius="$4"
      gap="$4"
      onPress={onPress}
      padding="$5"
      pressStyle={{opacity: 0.7}}
    >
      <Stack
        alignItems="center"
        backgroundColor="$accentHighlightSecondary"
        borderRadius="$3"
        height="$9"
        justifyContent="center"
        width="$9"
      >
        <Play color={theme.backgroundPrimary.get()} size={20} />
      </Stack>
      <Typography color="$foregroundPrimary" pt="$2" variant="description">
        {t('termsOfUse.dontHaveTime2')}
      </Typography>
    </XStack>
  )
}

export default FaqsRedirect
