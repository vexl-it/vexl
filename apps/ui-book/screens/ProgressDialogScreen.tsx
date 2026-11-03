import {
  Button,
  ProgressDialog,
  type ProgressIndication,
  YStack,
} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import React, {useEffect, useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

const indications: ReadonlyArray<{
  readonly label: string
  readonly indication: ProgressIndication
}> = [
  {label: 'Progress', indication: {type: 'progress', percentage: 0}},
  {label: 'Intermediate', indication: {type: 'intermediate'}},
  {label: 'Loader', indication: {type: 'loader'}},
  {label: 'Done', indication: {type: 'done'}},
]

function Demos(): React.JSX.Element {
  const [indication, setIndication] = useState<ProgressIndication | null>(null)
  const [visible, setVisible] = useState(false)
  const isProgressing =
    indication?.type === 'progress' && indication.percentage < 100

  useEffect(() => {
    if (indication === null) return

    const timeout = setTimeout(
      () => {
        if (isProgressing) {
          setIndication({
            type: 'progress',
            percentage: indication.percentage + 20,
          })
        } else {
          setVisible(false)
        }
      },
      isProgressing ? 500 : 2000
    )
    return () => {
      clearTimeout(timeout)
    }
  }, [indication, isProgressing])

  return (
    <YStack gap="$3">
      {pipe(
        indications,
        Array.map(({label, indication: next}) => (
          <Button
            key={label}
            size="small"
            variant="secondary"
            onPress={() => {
              setIndication(next)
              setVisible(true)
            }}
          >
            {label}
          </Button>
        ))
      )}
      <ProgressDialog
        visible={visible}
        title="Reencrypting offers"
        indicateProgress={indication ?? {type: 'hidden'}}
        belowProgressLeft="2 / 10"
        belowProgressRight="Encrypting offer for your contacts"
        bottomText="Closes automatically two seconds after it finishes"
        onHidden={() => {
          setIndication(null)
        }}
      />
    </YStack>
  )
}

export function ProgressDialogScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Progress Dialog" demos={Demos} />
}
