import {LoadErrorState} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [retryCount, setRetryCount] = useState(0)

  return (
    <>
      <DemoSection title="Loading">
        <LoadErrorState loading retryLabel="Try again" onRetry={() => {}} />
      </DemoSection>

      <DemoSection title={`Error (retried ${retryCount} times)`}>
        <LoadErrorState
          loading={false}
          errorMessage="Could not load data. Check your connection and try again."
          retryLabel="Try again"
          onRetry={() => {
            setRetryCount((count) => count + 1)
          }}
        />
      </DemoSection>
    </>
  )
}

export function LoadErrorStateScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Load Error State" demos={Demos} />
}
