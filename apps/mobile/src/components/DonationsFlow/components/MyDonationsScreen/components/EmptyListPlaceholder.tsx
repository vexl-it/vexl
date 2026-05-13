import {Button, MyDonationsEmptyStateGraphic, Typography} from '@vexl-next/ui'
import {YStack} from '@vexl-next/ui/src/primitives'
import React from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

interface Props {
  readonly onDonatePress: () => void
}

function EmptyListPlaceholder({onDonatePress}: Props): React.ReactElement {
  const {t} = useTranslation()

  return (
    <YStack f={1} ai="center" jc="flex-start" gap="$9" px="$5" pt="$5">
      <MyDonationsEmptyStateGraphic width={240} height={240} />
      <YStack ai="center" gap="$4" width="100%" maxWidth={295}>
        <Typography
          variant="heading3"
          color="$foregroundPrimary"
          textAlign="center"
        >
          {t('donationPrompt.giveLove')}
        </Typography>
        <YStack ai="center" gap="$4" width="100%">
          <Typography
            variant="description"
            color="$foregroundSecondary"
            textAlign="center"
          >
            {t('donations.emptyState.description')}
          </Typography>
          <Button
            variant="tertiary"
            size="small"
            onPress={onDonatePress}
            width="100%"
          >
            {t('donationPrompt.donate')}
          </Button>
        </YStack>
      </YStack>
    </YStack>
  )
}

export default EmptyListPlaceholder
