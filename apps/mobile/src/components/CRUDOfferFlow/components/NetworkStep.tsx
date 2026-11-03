import {type BtcNetwork} from '@vexl-next/domain/src/general/offers'
import {
  Button,
  EditStep,
  FilterTag,
  RowCheckbox,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {offerFormMolecule} from '../atoms/offerFormStateAtoms'
import {type OfferFormStepProps} from '../offerSetupSteps'

function NetworkStep({
  onComplete,
  ctaLabel,
  ...stepProps
}: OfferFormStepProps): React.JSX.Element {
  const {t} = useTranslation()
  const {locationStateAtom, updateBtcNetworkAtom} =
    useMolecule(offerFormMolecule)

  const locationState = useAtomValue(locationStateAtom)
  const btcNetwork = useAtomValue(updateBtcNetworkAtom)
  const updateBtcNetwork = useSetAtom(updateBtcNetworkAtom)

  const isOnline = locationState.includes('ONLINE')
  const lightningSelected = btcNetwork.includes('LIGHTING')
  const onChainSelected = btcNetwork.includes('ON_CHAIN')
  const hasNetworkSelected = lightningSelected || onChainSelected

  const selectedNetworkLabels = [
    ...(lightningSelected ? [t('offerForm.network.lightning')] : []),
    ...(onChainSelected ? [t('offerForm.network.onChainRedesign')] : []),
  ]

  return (
    <EditStep
      {...stepProps}
      title={t('offerForm.selectPaymentDetails')}
      value={selectedNetworkLabels.join(', ')}
    >
      <YStack gap="$3">
        <Typography
          variant="paragraphDemibold"
          color="$foregroundPrimary"
          paddingVertical="$3"
        >
          {t('offerForm.paymentType')}
        </Typography>
        <XStack flexWrap="wrap" gap="$3">
          <FilterTag
            label={
              isOnline
                ? t('offerForm.paymentMethod.revolut')
                : t('offerForm.paymentMethod.cash')
            }
            selected
          />
        </XStack>
      </YStack>

      <YStack gap="$3">
        <Typography
          variant="paragraphDemibold"
          color="$foregroundPrimary"
          paddingVertical="$3"
        >
          {t('offerForm.network.network')}
        </Typography>
        <RowCheckbox
          label={t('offerForm.network.lightning')}
          description={t('offerForm.network.lightningDescription')}
          checked={lightningSelected}
          onCheckedChange={() => {
            updateBtcNetwork('LIGHTING' satisfies BtcNetwork)
          }}
        />
        <RowCheckbox
          label={t('offerForm.network.onChainRedesign')}
          description={t('offerForm.network.onChainDescription')}
          checked={onChainSelected}
          onCheckedChange={() => {
            updateBtcNetwork('ON_CHAIN' satisfies BtcNetwork)
          }}
        />
      </YStack>

      {hasNetworkSelected ? (
        <Button variant="primary" size="large" onPress={onComplete}>
          {ctaLabel ?? t('offerForm.next')}
        </Button>
      ) : null}
    </EditStep>
  )
}

export default NetworkStep
