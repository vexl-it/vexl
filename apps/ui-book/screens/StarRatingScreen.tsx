import {StarRating, Typography, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [rating, setRating] = useState(3)

  return (
    <YStack gap="$3">
      <StarRating value={rating} onChange={setRating} />
      <Typography variant="description" color="$foregroundSecondary">
        Rating: {rating} / 5
      </Typography>
    </YStack>
  )
}

export function StarRatingScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Star Rating" demos={Demos} />
}
