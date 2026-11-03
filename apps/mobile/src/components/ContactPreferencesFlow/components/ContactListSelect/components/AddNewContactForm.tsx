import {useNavigation} from '@react-navigation/native'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  Button,
  CellPhoneMobileDevice,
  ChevronDown,
  DismissKeyboardOnPressOutside,
  FieldFrame,
  KeyboardStickyView,
  LoadingOverlay,
  Selector,
  TextField,
  Typography,
  XStack,
  YStack,
  useTheme,
} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {useMolecule} from 'bunshi/dist/react'
import {Effect, Option} from 'effect'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Platform, type LayoutChangeEvent, type TextInput} from 'react-native'
import {getCountryByCca2} from 'react-native-country-select'
import {type ContactPreferencesStackScreenProps} from '../../../../../navigationTypes'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {userPhoneNumberAtom} from '../../../../../state/session/userDataAtoms'
import {
  dismissKeyboardAndResolveOnLayoutUpdate,
  runAfterKeyboardDismiss,
} from '../../../../../utils/dismissKeyboardPromise'
import getCountryCode from '../../../../../utils/getCountryCode'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import toE164PhoneNumberWithDefaultCountryCode from '../../../../../utils/toE164PhoneNumberWithDefaultCountryCode'
import usePreventDiscardChangesWithConfirmation from '../../../../../utils/usePreventDiscardChangesWithConfirmation'
import {globalDialogAtom} from '../../../../GlobalDialog'
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
    addNewContactSelectedCountryCodeAtom,
    addNewContactActionAtom,
    updateContactActionAtom,
  } = useMolecule(contactSelectMolecule)
  const setSelectedCountryCode = useSetAtom(
    addNewContactSelectedCountryCodeAtom
  )
  const addNewContact = useSetAtom(addNewContactActionAtom)
  const updateContact = useSetAtom(updateContactActionAtom)
  const showGlobalDialog = useSetAtom(globalDialogAtom)
  const userPhoneNumber = useAtomValue(userPhoneNumberAtom)
  const selectedCountryCode = useAtomValue(addNewContactSelectedCountryCodeAtom)
  const selectedCountry =
    selectedCountryCode === undefined
      ? undefined
      : getCountryByCca2(selectedCountryCode)
  const callingCode =
    selectedCountry?.idd.root ?? `+${getCountryCode(userPhoneNumber)}`
  const navigation =
    useNavigation<
      ContactPreferencesStackScreenProps<'AddNewContact'>['navigation']
    >()
  const initialPhoneNumber = getInitialContactPhoneNumber(
    contactToEdit?.computedValues.normalizedNumber
  )
  const initialContactName = contactToEdit?.info.name ?? ''
  const initialSelectedCountryCode =
    contactToEdit === undefined
      ? undefined
      : parsePhoneNumber(contactToEdit.computedValues.normalizedNumber)
          .regionCode
  const footerHeightRef = useRef(0)
  const [footerHeight, setFooterHeight] = useState(0)
  const phoneNumberInputRef = useRef<TextInput>(null)
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber)
  const [contactName, setContactName] = useState(initialContactName)
  const [isSavingContact, setIsSavingContact] = useState(false)
  const [saveToPhoneAtom] = useState(() => atom(true))
  const saveToPhone = useAtomValue(saveToPhoneAtom)
  const setSaveToPhone = useSetAtom(saveToPhoneAtom)
  const rawPhoneNumber = phoneNumberWithCallingCode({
    callingCode,
    phoneNumber,
  })
  const normalizedPhoneNumber =
    toE164PhoneNumberWithDefaultCountryCode(rawPhoneNumber)
  const isPhoneNumberValid = Option.isSome(normalizedPhoneNumber)
  const isSubmitDisabled =
    isSavingContact || contactName.trim().length === 0 || !isPhoneNumberValid
  const isEditingContact = contactToEdit !== undefined
  const hasUnsavedChanges =
    contactName !== initialContactName ||
    phoneNumber !== initialPhoneNumber ||
    selectedCountryCode !== initialSelectedCountryCode ||
    (!isEditingContact && !saveToPhone)
  const shouldShowPhoneNumberError =
    phoneNumber.trim().length > 0 && !isPhoneNumberValid

  useEffect(() => {
    setContactName(initialContactName)
    setPhoneNumber(initialPhoneNumber)
    setIsSavingContact(false)
    setSaveToPhone(true)
    setSelectedCountryCode(initialSelectedCountryCode)

    return () => {
      setSelectedCountryCode(undefined)
    }
  }, [
    initialContactName,
    initialPhoneNumber,
    initialSelectedCountryCode,
    setSaveToPhone,
    setSelectedCountryCode,
  ])

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

  const validationError = useCallback((): string | undefined => {
    if (contactName.trim().length === 0) {
      return t('addContactDialog.contactNameRequired')
    }

    if (Option.isNone(normalizedPhoneNumber)) {
      return t('contactPreferences.addContactManually.invalidPhoneNumber')
    }

    return undefined
  }, [contactName, normalizedPhoneNumber, t])

  const saveContactForm = useCallback(async (): Promise<boolean> => {
    const error = validationError()

    if (error !== undefined) {
      await Effect.runPromise(
        showGlobalDialog({
          title: t('addContactDialog.contactCannotBeSavedTitle'),
          subtitle: error,
          positiveButtonText: t('common.close'),
        })
      )
      return false
    }

    if (Option.isNone(normalizedPhoneNumber)) return false

    setIsSavingContact(true)
    try {
      await dismissKeyboardAndResolveOnLayoutUpdate()

      return await Effect.runPromise(
        contactToEdit === undefined
          ? addNewContact({
              contactName,
              phoneNumber: normalizedPhoneNumber.value,
              saveToPhone,
            })
          : updateContact({
              contact: contactToEdit,
              contactName,
              phoneNumber: normalizedPhoneNumber.value,
            })
      )
    } finally {
      setIsSavingContact(false)
    }
  }, [
    addNewContact,
    contactName,
    contactToEdit,
    normalizedPhoneNumber,
    saveToPhone,
    showGlobalDialog,
    t,
    updateContact,
    validationError,
  ])

  const confirmLeave = useCallback(async (): Promise<boolean> => {
    if (Option.isNone(normalizedPhoneNumber)) {
      return await Effect.runPromise(
        showGlobalDialog({
          title: t('addContactDialog.contactCannotBeSavedTitle'),
          subtitle: t(
            'contactPreferences.addContactManually.invalidPhoneNumber'
          ),
          positiveButtonText: t('common.discard'),
          negativeButtonText: t('common.close'),
          disableClose: true,
        })
      )
    }

    const shouldSave = await Effect.runPromise(
      showGlobalDialog({
        title: t('addContactDialog.unsavedChangesTitle'),
        subtitle: t('addContactDialog.unsavedChangesDescription'),
        positiveButtonText: t('common.save'),
        negativeButtonText: t('common.discard'),
        disableClose: true,
      })
    )

    if (!shouldSave) return true

    return await saveContactForm()
  }, [normalizedPhoneNumber, saveContactForm, showGlobalDialog, t])

  const {leaveWithoutConfirmation} = usePreventDiscardChangesWithConfirmation({
    enabled: hasUnsavedChanges,
    confirmLeave,
    fallbackLeave: onClose,
  })

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
              <FieldFrame
                pressable
                role="button"
                alignSelf="auto"
                gap="$2"
                onPress={() => {
                  runAfterKeyboardDismiss(() => {
                    navigation.navigate('AddNewContactCountryPicker')
                  })
                }}
              >
                <Typography color="$accentHighlightPrimary" variant="paragraph">
                  {callingCode}
                </Typography>
                <ChevronDown
                  color={theme.accentHighlightPrimary.get()}
                  size={24}
                />
              </FieldFrame>
              <TextField
                ref={phoneNumberInputRef}
                flex={1}
                autoFocus={Platform.OS === 'android'}
                autoComplete="tel"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder={t(
                  'contactPreferences.addContactManually.phoneNumber'
                )}
              />
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
          <TextField
            autoComplete="name"
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            value={contactName}
            onChangeText={setContactName}
            placeholder={t('contactPreferences.addContactManually.name')}
          />
          {!isEditingContact ? (
            <Selector
              variant="switch"
              icon={CellPhoneMobileDevice}
              label={t('addContactDialog.alsoSaveToYourPhone')}
              valueAtom={saveToPhoneAtom}
            />
          ) : null}
        </YStack>
        <KeyboardStickyView
          style={{position: 'absolute', left: 0, right: 0, bottom: 0}}
        >
          <YStack paddingHorizontal="$5" onLayout={handleFooterLayout}>
            <Button
              disabled={isSubmitDisabled}
              onPress={() => {
                if (isSubmitDisabled) return

                void saveContactForm().then((success) => {
                  if (success) leaveWithoutConfirmation()
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
        <LoadingOverlay
          visible={isSavingContact}
          label={t('contacts.processingContacts')}
        />
      </YStack>
    </DismissKeyboardOnPressOutside>
  )
}
