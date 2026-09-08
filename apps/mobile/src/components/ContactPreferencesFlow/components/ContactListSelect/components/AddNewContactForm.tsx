import {useNavigation} from '@react-navigation/native'
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
import {Array, Effect, Option, pipe} from 'effect'
import {atom, useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import {Platform, type LayoutChangeEvent} from 'react-native'
import {getCountryByCca2} from 'react-native-country-select'
import {type ContactPreferencesStackScreenProps} from '../../../../../navigationTypes'
import {
  type ContactKind,
  type StoredContactWithComputedValues,
} from '../../../../../state/contacts/domain'
import {normalizeContactValue} from '../../../../../state/contacts/utils'
import {userPhoneNumberAtom} from '../../../../../state/session/userDataAtoms'
import {
  dismissKeyboardAndResolveOnLayoutUpdate,
  runAfterKeyboardDismiss,
} from '../../../../../utils/dismissKeyboardPromise'
import getCountryCode from '../../../../../utils/getCountryCode'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import usePreventDiscardChangesWithConfirmation from '../../../../../utils/usePreventDiscardChangesWithConfirmation'
import {globalDialogAtom} from '../../../../GlobalDialog'
import PreparingContactsOverlay from '../../PreparingContactsOverlay'
import {contactSelectMolecule} from '../atom'

interface Props {
  readonly contactToEdit?: StoredContactWithComputedValues | undefined
  readonly pairedContact?: StoredContactWithComputedValues | undefined
  readonly onClose: () => void
}

function rowOfKind(
  kind: ContactKind,
  rows: ReadonlyArray<StoredContactWithComputedValues | undefined>
): StoredContactWithComputedValues | undefined {
  return pipe(
    rows,
    Array.findFirst((row) => row?.info.kind === kind),
    Option.getOrUndefined
  )
}

function getInitialContactPhoneNumber(
  phoneRow: StoredContactWithComputedValues | undefined
): string {
  if (phoneRow === undefined) return ''

  const contactNumber = phoneRow.computedValues.normalizedValue
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
  if (trimmedPhoneNumber.length === 0) return ''
  return trimmedPhoneNumber.startsWith('+')
    ? trimmedPhoneNumber
    : `${callingCode}${trimmedPhoneNumber}`
}

function isValueInputValid(kind: ContactKind, input: string): boolean {
  return (
    input.trim().length === 0 ||
    Option.isSome(normalizeContactValue(kind, input))
  )
}

export default function AddNewContactForm({
  contactToEdit,
  pairedContact,
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
  const phoneRow = rowOfKind('phone', [contactToEdit, pairedContact])
  const emailRow = rowOfKind('email', [contactToEdit, pairedContact])
  const initialPhoneNumber = getInitialContactPhoneNumber(phoneRow)
  const initialEmail = emailRow?.computedValues.normalizedValue ?? ''
  const initialContactName = contactToEdit?.info.name ?? ''
  const initialSelectedCountryCode =
    phoneRow === undefined
      ? undefined
      : parsePhoneNumber(phoneRow.computedValues.normalizedValue).regionCode
  const footerHeightRef = useRef(0)
  const [footerHeight, setFooterHeight] = useState(0)
  const phoneNumberInputRef = useRef<React.ComponentRef<typeof Input>>(null)
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber)
  const [email, setEmail] = useState(initialEmail)
  const [contactName, setContactName] = useState(initialContactName)
  const [isSavingContact, setIsSavingContact] = useState(false)
  const [saveToPhoneAtom] = useState(() => atom(true))
  const saveToPhone = useAtomValue(saveToPhoneAtom)
  const setSaveToPhone = useSetAtom(saveToPhoneAtom)
  const rawPhoneNumber = phoneNumberWithCallingCode({
    callingCode,
    phoneNumber,
  })
  const isPhoneNumberValid = isValueInputValid('phone', rawPhoneNumber)
  const isEmailValid = isValueInputValid('email', email)
  const hasSomeValue = rawPhoneNumber.length > 0 || email.trim().length > 0
  const isSubmitDisabled =
    isSavingContact ||
    contactName.trim().length === 0 ||
    !hasSomeValue ||
    !isPhoneNumberValid ||
    !isEmailValid
  const isEditingContact = contactToEdit !== undefined
  const hasUnsavedChanges =
    contactName !== initialContactName ||
    phoneNumber !== initialPhoneNumber ||
    email !== initialEmail ||
    selectedCountryCode !== initialSelectedCountryCode ||
    (!isEditingContact && !saveToPhone)

  useEffect(() => {
    setContactName(initialContactName)
    setPhoneNumber(initialPhoneNumber)
    setEmail(initialEmail)
    setIsSavingContact(false)
    setSaveToPhone(true)
    setSelectedCountryCode(initialSelectedCountryCode)

    return () => {
      setSelectedCountryCode(undefined)
    }
  }, [
    initialContactName,
    initialEmail,
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

    if (!isPhoneNumberValid) {
      return t('contactPreferences.addContactManually.invalidPhoneNumber')
    }

    if (!isEmailValid) {
      return t('contactPreferences.addContactManually.invalidEmail')
    }

    if (!hasSomeValue) {
      return t(
        'contactPreferences.addContactManually.phoneNumberOrEmailRequired'
      )
    }

    return undefined
  }, [contactName, hasSomeValue, isEmailValid, isPhoneNumberValid, t])

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

    setIsSavingContact(true)
    try {
      await dismissKeyboardAndResolveOnLayoutUpdate()

      return await Effect.runPromise(
        contactToEdit === undefined
          ? addNewContact({
              contactName,
              phoneNumber: rawPhoneNumber,
              email,
              saveToPhone,
            })
          : updateContact({
              contact: contactToEdit,
              pairedContact,
              contactName,
              phoneNumber: rawPhoneNumber,
              email,
            })
      )
    } finally {
      setIsSavingContact(false)
    }
  }, [
    addNewContact,
    contactName,
    contactToEdit,
    email,
    pairedContact,
    rawPhoneNumber,
    saveToPhone,
    showGlobalDialog,
    t,
    updateContact,
    validationError,
  ])

  const confirmLeave = useCallback(async (): Promise<boolean> => {
    const error = validationError()

    if (error !== undefined) {
      return await Effect.runPromise(
        showGlobalDialog({
          title: t('addContactDialog.contactCannotBeSavedTitle'),
          subtitle: error,
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
  }, [saveContactForm, showGlobalDialog, t, validationError])

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
            {!isPhoneNumberValid ? (
              <Typography
                color="$redForeground"
                paddingHorizontal="$1"
                variant="micro"
              >
                {t('contactPreferences.addContactManually.invalidPhoneNumber')}
              </Typography>
            ) : null}
          </YStack>
          <YStack gap="$2">
            <XStack
              alignItems="center"
              backgroundColor="$backgroundSecondary"
              borderRadius="$5"
              height="$11"
              paddingHorizontal="$5"
            >
              <Input
                unstyled
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                color="$foregroundPrimary"
                flex={1}
                fontFamily="$body"
                fontSize="$4"
                fontWeight="500"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder={t('contactPreferences.addContactManually.email')}
                placeholderTextColor={theme.foregroundTertiary.get()}
                selectionColor={theme.accentYellowPrimary.get()}
                value={email}
              />
            </XStack>
            {!isEmailValid ? (
              <Typography
                color="$redForeground"
                paddingHorizontal="$1"
                variant="micro"
              >
                {t('contactPreferences.addContactManually.invalidEmail')}
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
          {!isEditingContact ? (
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
                {t('addContactDialog.alsoSaveToYourPhone')}
              </Typography>
              <Stack alignSelf="center" justifyContent="center">
                <Switch valueAtom={saveToPhoneAtom} />
              </Stack>
            </XStack>
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
        <PreparingContactsOverlay
          labelKey="contacts.processingContacts"
          visible={isSavingContact}
        />
      </YStack>
    </DismissKeyboardOnPressOutside>
  )
}
