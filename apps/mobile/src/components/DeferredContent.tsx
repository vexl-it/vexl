import {Loader} from '@vexl-next/ui'
import {Stack} from '@vexl-next/ui/src/primitives'
import React, {startTransition, useEffect, useState} from 'react'

interface DeferredContentProps {
  readonly children: React.ReactNode
}

function DeferredContent({children}: DeferredContentProps): React.JSX.Element {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    startTransition(() => {
      setReady(true)
    })
  }, [])

  if (!ready)
    return (
      <Stack flex={1} alignItems="center" justifyContent="center">
        <Loader size="large" />
      </Stack>
    )
  return <>{children}</>
}

export default DeferredContent
