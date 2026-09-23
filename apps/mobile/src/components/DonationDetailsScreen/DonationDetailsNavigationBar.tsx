import {useNavigation, useRoute} from '@react-navigation/native'
import {ChevronLeft, NavigationBar, TrashBin} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import React from 'react'
import {type DonationsFlowScreenProps} from '../../navigationTypes'
import useSafeGoBack from '../../utils/useSafeGoBack'
import {deleteDonationWithConfirmationActionAtom} from './deleteDonationWithConfirmationActionAtom'

export function DonationDetailsNavigationBar({
  title,
}: {
  readonly title: string
}): React.ReactElement {
  const {
    params: {invoiceId},
  } = useRoute<DonationsFlowScreenProps<'DonationDetails'>['route']>()
  const navigation = useNavigation()
  const safeGoBack = useSafeGoBack()
  const deleteDonationWithConfirmation = useSetAtom(
    deleteDonationWithConfirmationActionAtom
  )

  return (
    <NavigationBar
      style="back"
      title={title}
      leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
      rightActions={[
        {
          icon: TrashBin,
          variant: 'destructive',
          onPress: () => {
            Effect.runFork(
              Effect.andThen(
                deleteDonationWithConfirmation(invoiceId),
                (deleted) => {
                  if (deleted && navigation.isFocused()) safeGoBack()
                }
              )
            )
          },
        },
      ]}
    />
  )
}
