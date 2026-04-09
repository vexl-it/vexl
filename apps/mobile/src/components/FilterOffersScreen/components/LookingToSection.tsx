import {FilterTag, Typography} from '@vexl-next/ui'
import {XStack, YStack} from '@vexl-next/ui/src/primitives'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {marketplaceFilterBarFieldsAtom} from '../../../state/marketplace/atoms/filterAtoms'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {filterBarOptionsAtom, toggleFilterBarOptionActionAtom} from '../atom'

function LookingToSection(): React.ReactElement {
  const {t} = useTranslation()
  const selectedOptions = useAtomValue(filterBarOptionsAtom)
  const toggleOption = useSetAtom(toggleFilterBarOptionActionAtom)
  const items = useAtomValue(marketplaceFilterBarFieldsAtom)

  return (
    <YStack gap="$3">
      <Typography
        variant="titlesSmall"
        color="$foregroundPrimary"
        paddingVertical="$3"
      >
        {t('filterOffers.imLookingTo')}
      </Typography>
      <XStack flexWrap="wrap" gap="$3">
        {items.map((item) => (
          <FilterTag
            key={item.value}
            label={item.label}
            selected={selectedOptions.has(item.value)}
            onPress={() => {
              toggleOption(item.value)
            }}
          />
        ))}
      </XStack>
    </YStack>
  )
}

export default LookingToSection
