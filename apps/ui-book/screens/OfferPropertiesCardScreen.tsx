import {OfferPropertiesCard, YStack} from '@vexl-next/ui'
import React from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const rows = [
  {label: 'Amount', value: '1 000 - 25 000 CZK'},
  {label: 'Premium or discount', value: '+ 2 %'},
  {label: 'Expiration date', value: '31 Dec 2026'},
  {label: 'Location', value: ['Prague, Czechia', 'Brno, Czechia']},
  {label: 'Payment method', value: 'Cash, Bank, Revolut', numberOfLines: 1},
  {label: 'Preferred languages', value: 'Czech, English'},
]

function Demos(): React.JSX.Element {
  return (
    <YStack gap="$5">
      <OfferPropertiesCard rows={rows} />
      <OfferPropertiesCard rows={rows} minimalContainer />
    </YStack>
  )
}

export function OfferPropertiesCardScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Offer Properties Card" demos={Demos} />
}
