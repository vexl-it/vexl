import {useFocusEffect} from '@react-navigation/native'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Typography, XStack, YStack} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {StyleSheet, TextInput} from 'react-native'
import {getCountryByCca2, type ICountry} from 'react-native-country-select'
import {runAfterKeyboardDismiss} from '../../utils/dismissKeyboardPromise'
import InlineErrorText from '../InlineErrorText'
import {
  DEFAULT_COUNTRY,
  countryCallingCode,
  getGroupLengths,
  parsePhoneNumberInput,
  splitNationalNumberIntoGroups,
} from '../LoginFlow/utils/phoneNumberInput'
import {selectedCountryCodeAtom} from './selectedCountryCodeAtom'
import {useKeepInputFocused} from './useKeepInputFocused'

export interface PhoneNumberInputProps {
  readonly errorMessage: string | undefined
  readonly onPhoneNumberChange: (
    phoneNumber: Option.Option<E164PhoneNumber>
  ) => void
  readonly onCountryPickerPress: () => void
  // While true, the input does not grab focus back when the keyboard hides
  readonly refocusPausedRef: React.RefObject<boolean>
}

function NumberGroup({
  length,
  value,
}: {
  readonly length: number
  readonly value: string
}): React.ReactElement {
  return (
    <Typography
      color={value.length > 0 ? '$foregroundPrimary' : '$foregroundSecondary'}
      variant="heading3"
    >
      {value.padEnd(length, '0')}
    </Typography>
  )
}

export default function PhoneNumberInput({
  errorMessage,
  onPhoneNumberChange,
  onCountryPickerPress,
  refocusPausedRef,
}: PhoneNumberInputProps): React.ReactElement {
  const inputRef = useRef<TextInput>(null)
  const [selectedCountry, setSelectedCountry] = useState<ICountry | undefined>(
    DEFAULT_COUNTRY
  )
  const [nationalNumber, setNationalNumber] = useState('')
  // Prevent atom sync from clearing a number that came from the phone input.
  const pendingCountryCodeFromPhoneInputRef = useRef<string | undefined>(
    undefined
  )
  const selectedCountryCode = useAtomValue(selectedCountryCodeAtom)
  const setSelectedCountryCode = useSetAtom(selectedCountryCodeAtom)
  const phoneNumberGroupLengths = getGroupLengths(selectedCountry)

  useFocusEffect(
    useCallback(() => {
      refocusPausedRef.current = false
    }, [refocusPausedRef])
  )
  useKeepInputFocused(
    inputRef,
    useCallback(() => refocusPausedRef.current, [refocusPausedRef])
  )

  useEffect(() => {
    if (selectedCountryCode === undefined) return
    if (selectedCountry?.cca2 === selectedCountryCode) {
      pendingCountryCodeFromPhoneInputRef.current = undefined
      return
    }

    const country = getCountryByCca2(selectedCountryCode)
    if (country === undefined) return

    setSelectedCountry(country)
    if (pendingCountryCodeFromPhoneInputRef.current === selectedCountryCode) {
      pendingCountryCodeFromPhoneInputRef.current = undefined
      return
    }

    setNationalNumber('')
    onPhoneNumberChange(Option.none())
  }, [selectedCountryCode, selectedCountry?.cca2, onPhoneNumberChange])

  return (
    <YStack alignItems="center" gap="$3" width="100%">
      <XStack
        alignItems="center"
        gap="$4"
        justifyContent="center"
        onPress={() => {
          inputRef.current?.focus()
        }}
        pressStyle={{opacity: 0.8}}
        width="100%"
      >
        <Typography
          color="$foregroundPrimary"
          onPress={() => {
            refocusPausedRef.current = true
            runAfterKeyboardDismiss(onCountryPickerPress)
          }}
          pressStyle={{opacity: 0.8}}
          textDecorationLine="underline"
          variant="heading3"
        >
          {countryCallingCode(selectedCountry)}
        </Typography>
        <XStack
          alignItems="center"
          gap="$4"
          justifyContent="center"
          pos="relative"
        >
          <TextInput
            autoComplete="tel"
            autoFocus
            caretHidden
            keyboardType="phone-pad"
            onChangeText={(value) => {
              const parsedInput = parsePhoneNumberInput(value, selectedCountry)
              const parsedCountryCode = parsedInput.selectedCountry?.cca2

              setNationalNumber(parsedInput.nationalNumber)
              onPhoneNumberChange(parsedInput.phoneNumber)
              setSelectedCountry(parsedInput.selectedCountry)
              if (parsedCountryCode !== selectedCountry?.cca2) {
                pendingCountryCodeFromPhoneInputRef.current = parsedCountryCode
                setSelectedCountryCode(parsedCountryCode)
              }
            }}
            ref={inputRef}
            style={styles.phoneNumberInput}
            submitBehavior="submit"
            textContentType="telephoneNumber"
            value={nationalNumber}
          />
          {pipe(
            splitNationalNumberIntoGroups(nationalNumber, selectedCountry),
            Array.map((value, index) => (
              <NumberGroup
                key={`phone-number-group-${index}`}
                length={phoneNumberGroupLengths[index] ?? 0}
                value={value}
              />
            ))
          )}
        </XStack>
      </XStack>
      <InlineErrorText>{errorMessage}</InlineErrorText>
    </YStack>
  )
}

const styles = StyleSheet.create({
  phoneNumberInput: {
    backgroundColor: 'transparent',
    bottom: 0,
    color: 'transparent',
    left: 0,
    minWidth: '100%',
    opacity: 0.01,
    position: 'absolute',
    right: 0,
    textAlign: 'center',
    top: 0,
    width: '100%',
    zIndex: 1,
  },
})
