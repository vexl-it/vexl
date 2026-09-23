import {Button, MyDonationsEmptyStateGraphic, Typography} from '@vexl-next/ui'
import {YStack} from '@vexl-next/ui/src/primitives'
import React from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'

interface Props {
  readonly onDonatePress: () => void
  readonly variant?: 'noDonations' | 'noMatchingDonations'
}

function EmptyListPlaceholder({
  onDonatePress,
  variant = 'noDonations',
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const isFiltered = variant === 'noMatchingDonations'

  return (
    <YStack
      f={isFiltered ? undefined : 1}
      ai="center"
      jc="flex-start"
      gap="$9"
      px="$5"
      pt="$5"
    >
      {!isFiltered && <MyDonationsEmptyStateGraphic width={240} height={240} />}
      <YStack ai="center" gap="$4" width="100%" maxWidth={295}>
        <Typography
          variant="heading3"
          color="$foregroundPrimary"
          textAlign="center"
        >
          {t(
            isFiltered
              ? 'donations.filteredEmptyState.title'
              : 'donations.emptyState.title'
          )}
        </Typography>
        <YStack ai="center" gap="$4" width="100%">
          <Typography
            variant="description"
            color="$foregroundSecondary"
            textAlign="center"
          >
            {t(
              isFiltered
                ? 'donations.filteredEmptyState.description'
                : 'donations.emptyState.description'
            )}
          </Typography>
          {!isFiltered && (
            <Button
              variant="tertiary"
              size="small"
              onPress={onDonatePress}
              width="100%"
            >
              {t('donationPrompt.donate')}
            </Button>
          )}
        </YStack>
      </YStack>
    </YStack>
  )
}

export default EmptyListPlaceholder
