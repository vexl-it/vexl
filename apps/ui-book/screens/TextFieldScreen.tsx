import {TextField, TrashBin} from '@vexl-next/ui'
import {atom} from 'jotai'
import React, {useRef, useState} from 'react'
import {Alert, type TextInput} from 'react-native'

import {ComponentScreenLayout, DemoSection} from './ComponentScreenLayout'

function showAlert(message: string): void {
  Alert.alert('Action', message)
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
    <>
      <DemoSection title="Plain (valueAtom)">
        <TextField valueAtom={atoms.plain} />
      </DemoSection>
      <DemoSection title="Clear icon">
        <TextField valueAtom={atoms.clear} showClear />
      </DemoSection>
      <DemoSection title="Checkmark">
        <TextField
          valueAtom={atoms.checkmark}
          placeholder="Type and confirm"
          onCheckmarkPress={() => {
            showAlert('Checkmark pressed')
          }}
        />
      </DemoSection>
      <DemoSection title="Text button">
        <TextField
          valueAtom={atoms.textButton}
          buttonLabel="Change"
          onButtonPress={() => {
            showAlert('Button pressed')
          }}
        />
      </DemoSection>
      <DemoSection title="Custom icon">
        <TextField
          valueAtom={atoms.customIcon}
          icon={TrashBin}
          onIconPress={() => {
            showAlert('Icon pressed')
          }}
        />
      </DemoSection>
      <DemoSection title="Max length">
        <TextField valueAtom={atoms.maxLength} maxLength={30} />
      </DemoSection>
      <DemoSection title="Controlled value + native props">
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
      </DemoSection>
      <DemoSection title="Not editable">
        <TextField value="Read only" onChangeText={() => {}} editable={false} />
      </DemoSection>
    </>
  )
}

export function TextFieldScreen(): React.JSX.Element {
  return <ComponentScreenLayout title="Text Field" demos={Demos} />
}
