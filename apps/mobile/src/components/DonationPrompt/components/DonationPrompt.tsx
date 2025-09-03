import React from 'react'
import {Stack, Text, YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {ImageUniversal} from '../../Image'

function DonationPrompt(): React.ReactElement {
  const {t} = useTranslation()

  return (
    <YStack ai="center">
      <Stack ai="center" top="$-5" bc="$red">
        <ImageUniversal
          source={{
            type: 'requiredImage',
            image: require('../images/donate.png'),
          }}
        />
      </Stack>
      <Stack gap="$2">
        <Text
          fontFamily="$heading"
          fontSize={24}
          color="$black"
          textAlign="left"
        >
          {t('donationPrompt.giveLove')}
        </Text>
        <Text fontSize={18} color="$greyOnWhite" textAlign="left">
          {t('donationPrompt.ifYouLikeVexlSupportItsImprovement')}
        </Text>
      </Stack>
    </YStack>
  )
}

export default DonationPrompt
