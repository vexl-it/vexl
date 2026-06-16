import {useFocusEffect} from '@react-navigation/native'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Typography, XStack, YStack} from '@vexl-next/ui'
import {Effect, Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Keyboard, StyleSheet, TextInput} from 'react-native'
import {getCountryByCca2, type ICountry} from 'react-native-country-select'
import {type LoginFlowStackScreenProps} from '../../../navigationTypes'
import {
  dismissKeyboardAndResolveOnLayoutUpdate,
  runAfterKeyboardDismiss,
} from '../../../utils/dismissKeyboardPromise'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useShowLoadingOverlay} from '../../LoadingOverlayProvider'
import {initPhoneVerificationAtom} from '../api/initPhoneVerificationAtom'
import {selectedCountryCodeAtom} from '../atoms/selectedCountryCodeAtom'
import {
  DEFAULT_COUNTRY,
  countryCallingCode,
  getGroupLengths,
  parsePhoneNumberInput,
  splitNationalNumberIntoGroups,
} from '../utils/phoneNumberInput'
import LoginFlowScreen, {LoginFlowText, LoginFlowTitle} from './LoginFlowScreen'

type Props = LoginFlowStackScreenProps<'PhoneNumber'>

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
  // Prevent atom sync from clearing a number that came from the phone input.
  const pendingCountryCodeFromPhoneInputRef = useRef<string | undefined>(
    undefined
  )
  const navigationInProgressRef = useRef(false)
  const loadingOverlay = useShowLoadingOverlay()
  const initPhoneVerification = useSetAtom(initPhoneVerificationAtom)
  const phoneNumberGroupLengths = getGroupLengths(selectedCountry)
  const selectedCountryCode = useAtomValue(selectedCountryCodeAtom)
  const setSelectedCountryCode = useSetAtom(selectedCountryCodeAtom)
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

      navigationInProgressRef.current = false

      const focusInput = (): void => {
        if (navigationInProgressRef.current) return

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
            .then(async (result) => {
              if (result._tag === 'Some') {
                navigationInProgressRef.current = true
                await dismissKeyboardAndResolveOnLayoutUpdate()
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
          <Typography
            color="$foregroundPrimary"
            onPress={() => {
              navigationInProgressRef.current = true
              runAfterKeyboardDismiss(() => {
                navigation.navigate('CountryPicker')
              })
            }}
            pressStyle={{opacity: 0.8}}
            textDecorationLine="underline"
            variant="heading3"
          >
            {callingCode}
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
                const parsedInput = parsePhoneNumberInput(
                  value,
                  selectedCountry
                )
                const parsedCountryCode = parsedInput.selectedCountry?.cca2

                setNationalNumber(parsedInput.nationalNumber)
                setPhoneNumber(parsedInput.phoneNumber)
                setSelectedCountry(parsedInput.selectedCountry)
                if (parsedCountryCode !== selectedCountry?.cca2) {
                  pendingCountryCodeFromPhoneInputRef.current =
                    parsedCountryCode
                  setSelectedCountryCode(parsedCountryCode)
                }
              }}
              ref={inputRef}
              style={styles.phoneNumberInput}
              submitBehavior="submit"
              textContentType="telephoneNumber"
              value={nationalNumber}
            />
            {phoneNumberGroupElements}
          </XStack>
        </XStack>
      </YStack>
    </LoginFlowScreen>
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
