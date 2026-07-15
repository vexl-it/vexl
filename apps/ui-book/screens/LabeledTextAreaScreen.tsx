import {LabeledTextArea, YStack} from '@vexl-next/ui'
import React, {useState} from 'react'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function Demos(): React.JSX.Element {
  const [description, setDescription] = useState('')
  const [note, setNote] = useState('Meet near the main entrance.')

  return (
    <YStack gap="$5">
      <LabeledTextArea
        label="Offer description"
        value={description}
        onChangeText={setDescription}
        placeholder="Describe what you are looking for"
        maxLength={160}
      />
      <LabeledTextArea
        label="Private note"
        value={note}
        onChangeText={setNote}
        minHeight={96}
      />
    </YStack>
  )
}

export function LabeledTextAreaScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Labeled Text Area" demos={Demos} />
}
