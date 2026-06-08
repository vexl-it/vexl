import {useNavigation} from '@react-navigation/native'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  Button,
  CellPhoneMobileDevice,
  ChevronDown,
  DismissKeyboardOnPressOutside,
  Input,
  KeyboardStickyView,
  Stack,
  Switch,
  Typography,
  XStack,
  YStack,
  useTheme,
} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {useMolecule} from 'bunshi/dist/react'
import {Effect, Option} from 'effect'
import {atom, useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useEffect, useMemo, useRef, useState} from 'react'
import {Platform, type LayoutChangeEvent} from 'react-native'
import {getCountryByCca2} from 'react-native-country-select'
import {type RootStackScreenProps} from '../../../../../navigationTypes'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {userPhoneNumberAtom} from '../../../../../state/session/userDataAtoms'
import {
  dismissKeyboardAndResolveOnLayoutUpdate,
  runAfterKeyboardDismiss,
} from '../../../../../utils/dismissKeyboardPromise'
import getCountryCode from '../../../../../utils/getCountryCode'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import toE164PhoneNumberWithDefaultCountryCode from '../../../../../utils/toE164PhoneNumberWithDefaultCountryCode'
import PreparingContactsOverlay from '../../PreparingContactsOverlay'
import {contactSelectMolecule} from '../atom'

interface Props {
  readonly contactToEdit?: StoredContactWithComputedValues | undefined
  readonly onClose: () => void
}

function getInitialContactPhoneNumber(
  contactNumber: E164PhoneNumber | undefined
): string {
  if (contactNumber === undefined) return ''

  return parsePhoneNumber(contactNumber).number?.significant ?? contactNumber
}

function phoneNumberWithCallingCode({
  callingCode,
  phoneNumber,
}: {
  readonly callingCode: string
  readonly phoneNumber: string
}): string {
  const trimmedPhoneNumber = phoneNumber.trim()
  return trimmedPhoneNumber.startsWith('+')
    ? trimmedPhoneNumber
    : `${callingCode}${trimmedPhoneNumber}`
}

export default function AddNewContactForm({
  contactToEdit,
  onClose,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const {
    addNewContactActionAtom,
    addNewContactSelectedCountryCodeAtom,
    updateContactActionAtom,
  } = useMolecule(contactSelectMolecule)
  const addNewContact = useSetAtom(addNewContactActionAtom)
  const updateContact = useSetAtom(updateContactActionAtom)
  const setSelectedCountryCode = useSetAtom(
    addNewContactSelectedCountryCodeAtom
  )
  const userPhoneNumber = useAtomValue(userPhoneNumberAtom)
  const selectedCountryCode = useAtomValue(addNewContactSelectedCountryCodeAtom)
  const selectedCountry =
    selectedCountryCode === undefined
      ? undefined
      : getCountryByCca2(selectedCountryCode)
  const callingCode =
    selectedCountry?.idd.root ?? `+${getCountryCode(userPhoneNumber)}`
  const navigation =
    useNavigation<RootStackScreenProps<'AddNewContact'>['navigation']>()
  const initialPhoneNumber = getInitialContactPhoneNumber(
    contactToEdit?.computedValues.normalizedNumber
  )
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber)
  const [contactName, setContactName] = useState(contactToEdit?.info.name ?? '')
  const [submitting, setSubmitting] = useState(false)
  const footerHeightRef = useRef(0)
  const [footerHeight, setFooterHeight] = useState(0)
  const phoneNumberInputRef = useRef<React.ComponentRef<typeof Input>>(null)
  const saveToPhoneAtom = useMemo(() => atom(true), [])
  const [saveToPhone] = useAtom(saveToPhoneAtom)
  const isEditingContact = contactToEdit !== undefined
  const isAlreadyInPhoneContacts = Option.isSome(
    contactToEdit?.info.nonUniqueContactId ?? Option.none()
  )
  const rawPhoneNumber = phoneNumberWithCallingCode({
    callingCode,
    phoneNumber,
  })
  const isPhoneNumberValid = Option.isSome(
    toE164PhoneNumberWithDefaultCountryCode(rawPhoneNumber)
  )
  const shouldShowPhoneNumberError =
    phoneNumber.trim().length > 0 && !isPhoneNumberValid
  const isSubmitDisabled =
    submitting || contactName.trim().length === 0 || !isPhoneNumberValid

  useEffect(() => {
    if (contactToEdit !== undefined) {
      setSelectedCountryCode(
        parsePhoneNumber(contactToEdit.computedValues.normalizedNumber)
          .regionCode
      )
    }

    return () => {
      setSelectedCountryCode(undefined)
    }
  }, [contactToEdit, setSelectedCountryCode])

  useEffect(() => {
    setPhoneNumber(initialPhoneNumber)
    setContactName(contactToEdit?.info.name ?? '')
  }, [contactToEdit?.info.name, initialPhoneNumber])

  useEffect(() => {
    if (Platform.OS !== 'ios') return undefined

    const focusTimeout = setTimeout(() => {
      phoneNumberInputRef.current?.focus()
    }, 100)

    return () => {
      clearTimeout(focusTimeout)
    }
  }, [])

  const handleFooterLayout = React.useCallback((event: LayoutChangeEvent) => {
    const measuredFooterHeight = event.nativeEvent.layout.height
    if (footerHeightRef.current === measuredFooterHeight) return

    footerHeightRef.current = measuredFooterHeight
    setFooterHeight(measuredFooterHeight)
  }, [])

  return (
    <DismissKeyboardOnPressOutside>
      <YStack flex={1} justifyContent="space-between" pos="relative">
        <YStack
          gap="$5"
          paddingBottom={footerHeight}
          paddingHorizontal="$5"
          paddingTop="$5"
        >
          <YStack gap="$2">
            <XStack gap="$3" width="100%">
              <XStack
                alignItems="center"
                backgroundColor="$backgroundSecondary"
                borderRadius="$5"
                gap="$2"
                height="$11"
                justifyContent="center"
                onPress={() => {
                  runAfterKeyboardDismiss(() => {
                    navigation.navigate('AddNewContactCountryPicker')
                  })
                }}
                paddingHorizontal="$5"
                pressStyle={{opacity: 0.8}}
              >
                <Typography color="$accentHighlightPrimary" variant="paragraph">
                  {callingCode}
                </Typography>
                <ChevronDown
                  color={theme.accentHighlightPrimary.get()}
                  size={24}
                />
              </XStack>
              <XStack
                alignItems="center"
                backgroundColor="$backgroundSecondary"
                borderRadius="$5"
                flex={1}
                height="$11"
                paddingHorizontal="$5"
              >
                <Input
                  ref={phoneNumberInputRef}
                  unstyled
                  autoFocus={Platform.OS === 'android'}
                  autoComplete="tel"
                  color="$foregroundPrimary"
                  flex={1}
                  fontFamily="$body"
                  fontSize="$4"
                  fontWeight="500"
                  keyboardType="phone-pad"
                  onChangeText={setPhoneNumber}
                  placeholder={t(
                    'contactPreferences.addContactManually.phoneNumber'
                  )}
                  placeholderTextColor={theme.foregroundTertiary.get()}
                  selectionColor={theme.accentYellowPrimary.get()}
                  value={phoneNumber}
                />
              </XStack>
            </XStack>
            {shouldShowPhoneNumberError ? (
              <Typography
                color="$redForeground"
                paddingHorizontal="$1"
                variant="micro"
              >
                {t('contactPreferences.addContactManually.invalidPhoneNumber')}
              </Typography>
            ) : null}
          </YStack>
          <XStack
            alignItems="center"
            backgroundColor="$backgroundSecondary"
            borderRadius="$5"
            height="$11"
            paddingHorizontal="$5"
          >
            <Input
              unstyled
              autoComplete="name"
              color="$foregroundPrimary"
              flex={1}
              fontFamily="$body"
              fontSize="$4"
              fontWeight="500"
              onChangeText={setContactName}
              placeholder={t('contactPreferences.addContactManually.name')}
              placeholderTextColor={theme.foregroundTertiary.get()}
              returnKeyType="done"
              selectionColor={theme.accentYellowPrimary.get()}
              submitBehavior="blurAndSubmit"
              value={contactName}
            />
          </XStack>
          <XStack
            alignItems="center"
            backgroundColor="$backgroundSecondary"
            borderRadius="$5"
            gap="$4"
            height="$12"
            paddingHorizontal="$4"
          >
            <CellPhoneMobileDevice
              color={theme.foregroundPrimary.get()}
              size={24}
            />
            <Typography
              color="$foregroundPrimary"
              flex={1}
              variant="paragraphSmall"
            >
              {t(
                isEditingContact && isAlreadyInPhoneContacts
                  ? 'addContactDialog.updateInYourPhoneContacts'
                  : 'addContactDialog.alsoSaveToYourPhone'
              )}
            </Typography>
            <Stack alignSelf="center" justifyContent="center">
              <Switch valueAtom={saveToPhoneAtom} />
            </Stack>
          </XStack>
        </YStack>
        <KeyboardStickyView
          style={{position: 'absolute', left: 0, right: 0, bottom: 0}}
        >
          <YStack paddingHorizontal="$5" onLayout={handleFooterLayout}>
            <Button
              disabled={isSubmitDisabled}
              onPress={() => {
                if (isSubmitDisabled) return

                setSubmitting(true)
                void dismissKeyboardAndResolveOnLayoutUpdate()
                  .then(() => {
                    return Effect.runPromise(
                      contactToEdit === undefined
                        ? addNewContact({
                            contactName,
                            phoneNumber: rawPhoneNumber,
                            saveToPhone,
                          })
                        : updateContact({
                            contact: contactToEdit,
                            contactName,
                            phoneNumber: rawPhoneNumber,
                            saveToPhone,
                          })
                    )
                  })
                  .then((success) => {
                    if (success) onClose()
                  })
                  .finally(() => {
                    setSubmitting(false)
                  })
              }}
            >
              {t(
                isEditingContact
                  ? 'addContactDialog.saveChanges'
                  : 'addContactDialog.addContact'
              )}
            </Button>
          </YStack>
        </KeyboardStickyView>
        <PreparingContactsOverlay
          labelKey="contacts.processingContacts"
          visible={submitting}
        />
      </YStack>
    </DismissKeyboardOnPressOutside>
  )
}
