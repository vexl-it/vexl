import {LoadErrorState, Typography, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [retryCount, setRetryCount] = useState(0)

  return (
    <YStack gap="$5">
      <Typography variant="description" color="$foregroundSecondary">
        Loading
      </Typography>
      <LoadErrorState loading retryLabel="Try again" onRetry={() => {}} />

      <Typography variant="description" color="$foregroundSecondary">
        Error (retried {retryCount} times)
      </Typography>
      <LoadErrorState
        loading={false}
        errorMessage="Could not load data. Check your connection and try again."
        retryLabel="Try again"
        onRetry={() => {
          setRetryCount((count) => count + 1)
        }}
      />
    </YStack>
  )
}

export function LoadErrorStateScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Load Error State" demos={Demos} />
}
