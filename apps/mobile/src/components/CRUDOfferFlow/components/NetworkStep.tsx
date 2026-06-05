import {type BtcNetwork} from '@vexl-next/domain/src/general/offers'
import {Button, EditRow, FilterTag, Typography} from '@vexl-next/ui'
import {RadiobuttonCircleEmpty} from '@vexl-next/ui/src/icons/RadiobuttonCircleEmpty'
import {RadiobuttonCircleFilled} from '@vexl-next/ui/src/icons/RadiobuttonCircleFilled'
import type {IconProps} from '@vexl-next/ui/src/icons/types'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated'
import {useTheme, XStack, YStack} from 'tamagui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'

interface NetworkRowProps {
  readonly label: string
  readonly description: string
  readonly selected: boolean
  readonly onPress: () => void
}

function NetworkRow({
  label,
  description,
  selected,
  onPress,
}: NetworkRowProps): React.JSX.Element {
  const theme = useTheme()
  const iconColor = selected
    ? theme.accentHighlightPrimary.get()
    : theme.foregroundPrimary.get()
  const textColor = selected ? '$accentHighlightPrimary' : '$foregroundPrimary'

  return (
    <YStack
      backgroundColor={
        selected ? '$accentYellowSecondary' : '$backgroundSecondary'
      }
      padding="$5"
      borderRadius="$5"
      gap="$3"
      pressStyle={{opacity: 0.7}}
      onPress={onPress}
    >
      <XStack gap="$3" alignItems="center">
        {selected ? (
          <RadiobuttonCircleFilled size={24} color={iconColor} />
        ) : (
          <RadiobuttonCircleEmpty size={24} color={iconColor} />
        )}
        <Typography variant="paragraph" color={textColor} flex={1}>
          {label}
        </Typography>
      </XStack>
      <YStack paddingLeft="$8">
        <Typography variant="description" color={textColor}>
          {description}
        </Typography>
      </YStack>
    </YStack>
  )
}

interface NetworkStepProps {
  readonly active: boolean
  readonly onEdit: () => void
  readonly onComplete: () => void
  readonly ctaLabel?: string
  readonly icon?: React.ComponentType<IconProps>
  readonly overline?: string
  readonly showInitialIcon?: boolean
}

function NetworkStep({
  active,
  onEdit,
  onComplete,
  ctaLabel,
  icon,
  overline,
  showInitialIcon,
}: NetworkStepProps): React.JSX.Element {
  const {t} = useTranslation()
  const {locationStateAtom, updateBtcNetworkAtom} =
    useMolecule(offerFormMolecule)

  const locationState = useAtomValue(locationStateAtom)
  const btcNetwork = useAtomValue(updateBtcNetworkAtom)
  const updateBtcNetwork = useSetAtom(updateBtcNetworkAtom)

  const isOnline = locationState?.includes('ONLINE') ?? false
  const lightningSelected = btcNetwork?.includes('LIGHTING') ?? false
  const onChainSelected = btcNetwork?.includes('ON_CHAIN') ?? false
  const hasNetworkSelected = lightningSelected || onChainSelected

  if (!active) {
    const parts: string[] = []
    if (lightningSelected) parts.push(t('offerForm.network.lightning'))
    if (onChainSelected) parts.push(t('offerForm.network.onChainRedesign'))

    return (
      <EditRow
        state="completed"
        icon={icon}
        overline={overline ?? t('offerForm.selectPaymentDetails')}
        headline={parts.join(', ')}
        onPress={onEdit}
      />
    )
  }

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <YStack>
        <EditRow
          state="initial"
          headline={t('offerForm.selectPaymentDetails')}
          showInitialIcon={showInitialIcon}
        />
        <YStack gap="$5" paddingVertical="$5">
          <YStack gap="$3">
            <XStack paddingVertical="$3">
              <Typography
                variant="paragraphDemibold"
                color="$foregroundPrimary"
              >
                {t('offerForm.paymentType')}
              </Typography>
            </XStack>
            <XStack flexWrap="wrap" gap="$3">
              {isOnline ? (
                <FilterTag
                  label={t('offerForm.paymentMethod.revolut')}
                  selected
                />
              ) : (
                <FilterTag label={t('offerForm.paymentMethod.cash')} selected />
              )}
            </XStack>
          </YStack>

          <YStack gap="$3">
            <XStack paddingVertical="$3">
              <Typography
                variant="paragraphDemibold"
                color="$foregroundPrimary"
              >
                {t('offerForm.network.network')}
              </Typography>
            </XStack>
            <NetworkRow
              label={t('offerForm.network.lightning')}
              description={t('offerForm.network.lightningDescription')}
              selected={lightningSelected}
              onPress={() => {
                updateBtcNetwork('LIGHTING' satisfies BtcNetwork)
              }}
            />
            <NetworkRow
              label={t('offerForm.network.onChainRedesign')}
              description={t('offerForm.network.onChainDescription')}
              selected={onChainSelected}
              onPress={() => {
                updateBtcNetwork('ON_CHAIN' satisfies BtcNetwork)
              }}
            />
          </YStack>

          {hasNetworkSelected ? (
            <Button variant="primary" size="large" onPress={onComplete}>
              {ctaLabel ?? t('offerForm.next')}
            </Button>
          ) : null}
        </YStack>
      </YStack>
    </Animated.View>
  )
}

export default NetworkStep
