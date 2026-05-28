import {Typography, YStack} from '@vexl-next/ui'
import React from 'react'
import {useTranslation} from '../../../../../../utils/localization/I18nProvider'

function BoardScreen(): React.JSX.Element {
  const {t} = useTranslation()

  return (
    <YStack f={1} paddingHorizontal="$5" paddingTop="$5" alignItems="center">
      <YStack
        width="100%"
        maxWidth={360}
        alignItems="center"
        gap="$4"
        paddingHorizontal="$5"
        paddingVertical="$8"
        borderRadius="$5"
        backgroundColor="$backgroundSecondary"
      >
        <Typography
          variant="heading3"
          color="$foregroundPrimary"
          textAlign="center"
        >
          {t('community.board.comingSoon')}
        </Typography>
        <Typography
          variant="paragraphSmall"
          color="$foregroundSecondary"
          textAlign="center"
        >
          {t('community.board.comingSoonDescription')}
        </Typography>
      </YStack>
    </YStack>
  )
}

export default BoardScreen
