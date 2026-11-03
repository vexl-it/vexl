import {TextField, Typography, YStack} from '@vexl-next/ui'
import {TrashBin} from '@vexl-next/ui/src/icons/TrashBin'
import {atom} from 'jotai'
import React, {useRef, useState} from 'react'
import {Alert, type TextInput} from 'react-native'

import {ComponentScreenLayout} from './ComponentScreenLayout'

function showAlert(message: string): void {
  Alert.alert('Action', message)
}

function Label({children}: {readonly children: string}): React.JSX.Element {
  return (
    <Typography variant="descriptionBold" color="$foregroundSecondary">
      {children}
    </Typography>
  )
}

function Demos(): React.JSX.Element {
  const [atoms] = useState(() => ({
    plain: atom(''),
    clear: atom('Hello'),
    checkmark: atom(''),
    textButton: atom('Holešovice 238/8, Prague 7'),
    customIcon: atom('Vinohradská 123/34 CZ'),
    maxLength: atom('Praha - CZ'),
  }))
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const nameInputRef = useRef<TextInput>(null)

  return (
    <YStack gap="$3">
      <Label>Plain (valueAtom)</Label>
      <TextField valueAtom={atoms.plain} />

      <Label>Clear icon</Label>
      <TextField valueAtom={atoms.clear} showClear />

      <Label>Checkmark</Label>
      <TextField
        valueAtom={atoms.checkmark}
        placeholder="Type and confirm"
        onCheckmarkPress={() => {
          showAlert('Checkmark pressed')
        }}
      />

      <Label>Text button</Label>
      <TextField
        valueAtom={atoms.textButton}
        buttonLabel="Change"
        onButtonPress={() => {
          showAlert('Button pressed')
        }}
      />

      <Label>Custom icon</Label>
      <TextField
        valueAtom={atoms.customIcon}
        icon={TrashBin}
        onIconPress={() => {
          showAlert('Icon pressed')
        }}
      />

      <Label>Max length</Label>
      <TextField valueAtom={atoms.maxLength} maxLength={30} />

      <Label>Controlled value + native props</Label>
      <TextField
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone number"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => {
          nameInputRef.current?.focus()
        }}
      />
      <TextField
        ref={nameInputRef}
        value={name}
        onChangeText={setName}
        placeholder="Name (focused via ref)"
        autoComplete="name"
        returnKeyType="done"
        showClear
      />

      <Label>Not editable</Label>
      <TextField value="Read only" onChangeText={() => {}} editable={false} />
    </YStack>
  )
}

export function TextFieldScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Text Field" demos={Demos} />
}
