import {useFocusEffect} from '@react-navigation/native'
import {
  toE164PhoneNumber,
  type E164PhoneNumber,
} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Typography, XStack, YStack} from '@vexl-next/ui'
import {Effect, Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import type {CountryCode} from 'libphonenumber-js'
import {
  AsYouType,
  getExampleNumber,
  isSupportedCountry,
} from 'libphonenumber-js'
import examples from 'libphonenumber-js/examples.mobile.json'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Keyboard, TextInput} from 'react-native'
import {getCountryByCca2, type ICountry} from 'react-native-country-select'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useShowLoadingOverlay} from '../../LoadingOverlayProvider'
import {initPhoneVerificationAtom} from '../api/initPhoneVerificationAtom'
import {selectedCountryCodeAtom} from '../atoms/selectedCountryCodeAtom'
import LoginFlowScreen, {LoginFlowText, LoginFlowTitle} from './LoginFlowScreen'

type Props = LoginFlowStackScreenProps<'PhoneNumber'>
const FALLBACK_NATIONAL_NUMBER_LENGTH = 15
const FALLBACK_GROUP_LENGTH = 3
const DEFAULT_COUNTRY = getCountryByCca2('CZ')

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

function supportedCountryCode(
  country: ICountry | undefined
): CountryCode | undefined {
  if (country === undefined) return undefined
  return isSupportedCountry(country.cca2) ? country.cca2 : undefined
}

function countryCallingCode(country: ICountry | undefined): string {
  return country?.idd.root ?? '+420'
}

function getNationalNumberLength(country: ICountry | undefined): number {
  const countryCode = supportedCountryCode(country)
  if (countryCode === undefined) return FALLBACK_NATIONAL_NUMBER_LENGTH

  return (
    getExampleNumber(countryCode, examples)?.nationalNumber.length ??
    FALLBACK_NATIONAL_NUMBER_LENGTH
  )
}

function getGroupLengths(country: ICountry | undefined): readonly number[] {
  const countryCode = supportedCountryCode(country)
  const exampleNumber =
    countryCode === undefined
      ? undefined
      : getExampleNumber(countryCode, examples)

  if (exampleNumber === undefined) {
    const groups: number[] = []
    const maxLength = getNationalNumberLength(country)

    for (let remainingDigits = maxLength; remainingDigits > 0; ) {
      const groupLength = Math.min(FALLBACK_GROUP_LENGTH, remainingDigits)
      groups.push(groupLength)
      remainingDigits -= groupLength
    }

    return groups
  }

  const formattedExample = new AsYouType().input(exampleNumber.number)
  const nationalExample = formattedExample
    .substring(countryCallingCode(country).length)
    .trim()
  const groups = nationalExample.match(/\d+/g)

  if (groups === null) return [exampleNumber.nationalNumber.length]

  const groupLengths: number[] = []
  for (const group of groups) {
    groupLengths.push(group.length)
  }

  return groupLengths
}

function splitNationalNumberIntoGroups(
  nationalNumber: string,
  country: ICountry | undefined
): readonly string[] {
  const groups: string[] = []
  let currentIndex = 0

  for (const groupLength of getGroupLengths(country)) {
    groups.push(
      nationalNumber.substring(currentIndex, currentIndex + groupLength)
    )
    currentIndex += groupLength
  }

  return groups
}

export default function PhoneNumberScreen({
  navigation,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const inputRef = useRef<TextInput>(null)
  const [selectedCountry, setSelectedCountry] = useState<ICountry | undefined>(
    DEFAULT_COUNTRY
  )
  const [nationalNumber, setNationalNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState<
    Option.Option<E164PhoneNumber>
  >(Option.none())
  const loadingOverlay = useShowLoadingOverlay()
  const initPhoneVerification = useSetAtom(initPhoneVerificationAtom)
  const phoneNumberMaxLength = getNationalNumberLength(selectedCountry)
  const phoneNumberGroupLengths = getGroupLengths(selectedCountry)
  const selectedCountryCode = useAtomValue(selectedCountryCodeAtom)
  const displayedPhoneNumberGroups = splitNationalNumberIntoGroups(
    nationalNumber,
    selectedCountry
  )
  const callingCode = countryCallingCode(selectedCountry)
  const phoneNumberGroupElements: React.ReactElement[] = []

  for (let index = 0; index < displayedPhoneNumberGroups.length; index++) {
    phoneNumberGroupElements.push(
      <NumberGroup
        key={`phone-number-group-${index}`}
        length={phoneNumberGroupLengths[index] ?? 0}
        value={displayedPhoneNumberGroups[index] ?? ''}
      />
    )
  }

  useFocusEffect(
    useCallback(() => {
      let refocusTimeout: ReturnType<typeof setTimeout> | undefined

      const focusInput = (): void => {
        inputRef.current?.focus()
      }

      const scheduleFocus = (): void => {
        if (refocusTimeout !== undefined) clearTimeout(refocusTimeout)
        refocusTimeout = setTimeout(focusInput, 50)
      }

      scheduleFocus()

      const keyboardDidHideSubscription = Keyboard.addListener(
        'keyboardDidHide',
        scheduleFocus
      )

      return () => {
        if (refocusTimeout !== undefined) clearTimeout(refocusTimeout)
        keyboardDidHideSubscription.remove()
      }
    }, [])
  )

  useEffect(() => {
    if (selectedCountryCode === undefined) return
    if (selectedCountry?.cca2 === selectedCountryCode) return

    const country = getCountryByCca2(selectedCountryCode)
    if (country === undefined) return

    setSelectedCountry(country)
    setNationalNumber('')
    setPhoneNumber(Option.none())
  }, [selectedCountryCode, selectedCountry?.cca2])

  return (
    <LoginFlowScreen
      footer={
        <LoginFlowText>{t('loginFlow.v2.phoneNumber.caption')}</LoginFlowText>
      }
      action={{
        disabled: Option.isNone(phoneNumber),
        label: t('common.continue'),
        onPress: () => {
          if (Option.isNone(phoneNumber)) return

          loadingOverlay.show()
          void Effect.runPromise(initPhoneVerification(phoneNumber.value))
            .then((result) => {
              if (result._tag === 'Some') {
                navigation.navigate('VerificationCode', {
                  phoneNumber: phoneNumber.value,
                  initPhoneVerificationResponse: result.value,
                })
              }
            })
            .finally(loadingOverlay.hide)
        },
      }}
      scroll
    >
      <YStack flex={1} gap="$10" justifyContent="flex-start" paddingTop="$11">
        <YStack gap="$4" width="100%">
          <LoginFlowTitle>{t('loginFlow.v2.phoneNumber.title')}</LoginFlowTitle>
          <LoginFlowText>{t('loginFlow.v2.phoneNumber.text')}</LoginFlowText>
        </YStack>
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
          <TextInput
            autoFocus
            keyboardType="number-pad"
            maxLength={phoneNumberMaxLength}
            onChangeText={(value) => {
              const digits = value
                .replace(/\D/g, '')
                .substring(0, phoneNumberMaxLength)
              setNationalNumber(digits)
              setPhoneNumber(toE164PhoneNumber(`${callingCode}${digits}`))
            }}
            ref={inputRef}
            style={{height: 1, opacity: 0, position: 'absolute', width: 1}}
            submitBehavior="submit"
            value={nationalNumber}
          />
          <Typography
            color="$foregroundPrimary"
            onPress={() => {
              Keyboard.dismiss()
              navigation.navigate('CountryPicker')
            }}
            pressStyle={{opacity: 0.8}}
            textDecorationLine="underline"
            variant="heading3"
          >
            {callingCode}
          </Typography>
          {phoneNumberGroupElements}
        </XStack>
      </YStack>
    </LoginFlowScreen>
  )
}
