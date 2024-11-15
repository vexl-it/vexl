import {Stack, XStack} from 'tamagui'
import TouchableStar from './TouchableStar'

const STAR_ORDER_NUMBERS = [1, 2, 3, 4, 5]

function StarRating(): JSX.Element {
  return (
    <Stack ai="center" gap="$4">
      <XStack ai="center" gap="$2">
        {STAR_ORDER_NUMBERS.map((orderNumber) => (
          <TouchableStar key={orderNumber} starOrderNumber={orderNumber} />
        ))}
      </XStack>
    </Stack>
  )
}

export default StarRating
