import {Stack, XStack} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React from 'react'
import TouchableStar from './TouchableStar'

const STAR_ORDER_NUMBERS = [1, 2, 3, 4, 5]

function StarRating(): React.ReactElement {
  return (
    <Stack ai="center" gap="$4">
      <XStack ai="center" gap="$2">
        {pipe(
          STAR_ORDER_NUMBERS,
          Array.map((orderNumber) => (
            <TouchableStar key={orderNumber} starOrderNumber={orderNumber} />
          ))
        )}
      </XStack>
    </Stack>
  )
}

export default StarRating
