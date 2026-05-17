import {Stack, Typography, YStack} from '@vexl-next/ui'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {ImageUniversal} from '../../Image'

function DonationPrompt(): React.ReactElement {
  const {t} = useTranslation()

  return (
    <YStack ai="center">
      <Stack ai="center" top="$-5">
        <ImageUniversal
          source={{
            type: 'requiredImage',
            image: require('../images/donate.png'),
          }}
        />
      </Stack>
      <Stack gap="$2">
        <Typography
          variant="heading3"
          color="$foregroundPrimary"
          textAlign="left"
        >
          {t('donationPrompt.giveLove')}
        </Typography>
        <Typography
          variant="paragraph"
          color="$foregroundSecondary"
          textAlign="left"
        >
          {t('donationPrompt.ifYouLikeVexlSupportItsImprovement')}
        </Typography>
      </Stack>
    </YStack>
  )
}

export default DonationPrompt
