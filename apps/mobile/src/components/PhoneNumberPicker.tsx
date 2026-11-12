import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {RadioGroup, RowRadiobutton, Typography, YStack} from '@vexl-next/ui'
import {Array, pipe} from 'effect'
import {useAtomValue} from 'jotai'
import React, {useState} from 'react'
import {pickedPhoneNumberOrMain} from '../state/session/sessionPhoneNumbers'
import {userPhoneNumbersAtom} from '../state/session/userDataAtoms'
import {getInternationalPhoneNumber} from '../utils/getInternationalPhoneNumber'

// Main number until the user picks another one.
export function usePickedPhoneNumber(): {
  readonly phoneNumbers: Array.NonEmptyReadonlyArray<E164PhoneNumber>
  readonly phoneNumber: E164PhoneNumber
  readonly pickPhoneNumber: (phoneNumber: E164PhoneNumber) => void
} {
  const phoneNumbers = useAtomValue(userPhoneNumbersAtom)
  const [picked, pickPhoneNumber] = useState<E164PhoneNumber>()

  return {
    phoneNumbers,
    phoneNumber: pickedPhoneNumberOrMain(phoneNumbers, picked),
    pickPhoneNumber,
  }
}

// Renders nothing for an account with a single number.
export function PhoneNumberPicker({
  phoneNumbers,
  value,
  onValueChange,
  title,
  text,
}: {
  readonly phoneNumbers: readonly E164PhoneNumber[]
  readonly value: E164PhoneNumber
  readonly onValueChange: (phoneNumber: E164PhoneNumber) => void
  readonly title: string
  readonly text: string
}): React.ReactElement | null {
  if (phoneNumbers.length < 2) return null

  return (
    <YStack gap="$3">
      <Typography variant="paragraphDemibold" color="$foregroundPrimary">
        {title}
      </Typography>
      <Typography variant="description" color="$foregroundSecondary">
        {text}
      </Typography>
      <RadioGroup
        allowedValues={phoneNumbers}
        value={value}
        onValueChange={onValueChange}
      >
        <YStack gap="$3">
          {pipe(
            phoneNumbers,
            Array.map((one) => (
              <RowRadiobutton
                key={one}
                value={one}
                label={getInternationalPhoneNumber(one)}
              />
            ))
          )}
        </YStack>
      </RadioGroup>
    </YStack>
  )
}
