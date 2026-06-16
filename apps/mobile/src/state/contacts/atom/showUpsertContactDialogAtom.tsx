import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type SvgStringOrImageUri} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import {toBasicError} from '@vexl-next/domain/src/utility/errors'
import {
  Avatar,
  CellPhoneMobileDevice,
  IconButton,
  PencilWriteEdit,
  Selector,
  Stack,
  TextField,
  Typography,
  UserImagePlaceholder,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {parsePhoneNumber} from 'awesome-phonenumber'
import {Effect, Option} from 'effect'
import {atom, useAtomValue, type SetStateAction, type WritableAtom} from 'jotai'
import React from 'react'
import {Keyboard} from 'react-native'
import {SvgXml} from 'react-native-svg'
import {useTheme} from 'tamagui'
import ContactPictureImage from '../../../components/ContactPictureImage'
import {globalDialogAtom} from '../../../components/GlobalDialog'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import resolveLocalUri from '../../../utils/resolveLocalUri'
import {type NonUniqueContactId} from '../domain'

type StringAtom = WritableAtom<string, [SetStateAction<string>], void>
type BooleanAtom = WritableAtom<boolean, [SetStateAction<boolean>], void>

type ShowUpsertContactDialogParams =
  | {
      type: 'create'
      contactName?: string
      contactNumber: E164PhoneNumber
      phoneContactId?: Option.Option<NonUniqueContactId>
      profileImage?: SvgStringOrImageUri
    }
  | {
      type: 'edit'
      contactName: string
      existingContactName: string
      contactNumber: E164PhoneNumber
      phoneContactId?: Option.Option<NonUniqueContactId>
      profileImage?: SvgStringOrImageUri
    }

function safeParsePhoneNumber(contactNumber: E164PhoneNumber): string {
  try {
    return parsePhoneNumber(contactNumber).number?.international ?? ''
  } catch (err) {
    return ''
  }
}

function UpsertContactDialogBody({
  contactNameAtom,
  contactNumber,
  fallbackContactName,
  placeholder,
  profileImage,
  saveToPhoneAtom,
  saveToPhoneLabel,
  phoneContactId,
}: {
  contactNameAtom: StringAtom
  contactNumber: string
  fallbackContactName?: string
  placeholder: string
  profileImage?: SvgStringOrImageUri
  saveToPhoneAtom: BooleanAtom
  saveToPhoneLabel: string
  phoneContactId?: Option.Option<NonUniqueContactId>
}): React.JSX.Element {
  const currentContactName = useAtomValue(contactNameAtom).trim()
  const previewName = currentContactName || fallbackContactName || contactNumber

  return (
    <YStack gap="$3">
      <UpsertContactDialogContactRow
        contactName={previewName}
        contactNumber={contactNumber}
        phoneContactId={phoneContactId}
        profileImage={profileImage}
      />
      <TextField
        backgroundColor="$backgroundPrimary"
        autoFocus
        valueAtom={contactNameAtom}
        placeholder={placeholder}
        onCheckmarkPress={Keyboard.dismiss}
      />
      <Selector
        variant="switch"
        backgroundColor="$backgroundPrimary"
        label={saveToPhoneLabel}
        icon={CellPhoneMobileDevice}
        valueAtom={saveToPhoneAtom}
      />
    </YStack>
  )
}

function ContactExistsFromLinkDialogBody({
  contactNameAtom,
  contactNumber,
  description,
  fallbackContactName,
  profileImage,
  saveToPhoneAtom,
  saveToPhoneLabel,
  editLabel,
}: {
  contactNameAtom: StringAtom
  contactNumber: string
  description: string
  fallbackContactName: string
  profileImage?: SvgStringOrImageUri
  saveToPhoneAtom: BooleanAtom
  saveToPhoneLabel: string
  editLabel: string
}): React.JSX.Element {
  const theme = useTheme()
  const [isEditingName, setIsEditingName] = React.useState(false)
  const currentContactName = useAtomValue(contactNameAtom)
  const previewName = currentContactName.trim() || fallbackContactName

  return (
    <YStack gap="$5">
      <Typography color="$foregroundSecondary" variant="paragraphSmall">
        {description}
      </Typography>
      <YStack gap="$3">
        <UpsertContactDialogContactRow
          contactName={previewName}
          contactNumber={contactNumber}
          profileImage={profileImage}
          rightElement={
            isEditingName ? null : (
              <IconButton
                aria-label={editLabel}
                backgroundColor="$backgroundSecondary"
                onPress={() => {
                  setIsEditingName(true)
                }}
              >
                <PencilWriteEdit
                  color={theme.foregroundPrimary.get()}
                  size={20}
                />
              </IconButton>
            )
          }
        />
        {isEditingName ? (
          <TextField
            backgroundColor="$backgroundPrimary"
            autoFocus
            valueAtom={contactNameAtom}
            placeholder={fallbackContactName}
            showClear
            onCheckmarkPress={() => {
              Keyboard.dismiss()
              setIsEditingName(false)
            }}
          />
        ) : null}
      </YStack>
      <Selector
        variant="switch"
        backgroundColor="$backgroundPrimary"
        label={saveToPhoneLabel}
        icon={CellPhoneMobileDevice}
        valueAtom={saveToPhoneAtom}
      />
    </YStack>
  )
}

export function UpsertContactDialogContactRow({
  contactName,
  contactNumber,
  phoneContactId,
  profileImage,
  rightElement,
}: {
  readonly contactName: string
  readonly contactNumber: string
  readonly phoneContactId?: Option.Option<NonUniqueContactId>
  readonly profileImage?: SvgStringOrImageUri
  readonly rightElement?: React.ReactNode
}): React.JSX.Element {
  return (
    <XStack
      alignItems="center"
      gap="$3"
      padding="$3"
      borderRadius="$5"
      backgroundColor="$backgroundPrimary"
    >
      <Stack>
        <UpsertContactDialogAvatar
          phoneContactId={phoneContactId}
          profileImage={profileImage}
        />
      </Stack>
      <YStack flex={1} gap="$2" minWidth={0}>
        <Typography
          color="$foregroundPrimary"
          numberOfLines={1}
          variant="descriptionBold"
        >
          {contactName}
        </Typography>
        <Typography
          color="$foregroundSecondary"
          numberOfLines={1}
          variant="micro"
        >
          {contactNumber}
        </Typography>
      </YStack>
      {rightElement != null ? (
        <Stack flexShrink={0}>{rightElement}</Stack>
      ) : null}
    </XStack>
  )
}

function UpsertContactDialogAvatar({
  phoneContactId,
  profileImage,
}: {
  phoneContactId?: Option.Option<NonUniqueContactId>
  profileImage?: SvgStringOrImageUri
}): React.JSX.Element {
  if (profileImage?.type === 'imageUri') {
    return (
      <Avatar
        customSize={40}
        source={{uri: resolveLocalUri(profileImage.imageUri)}}
      />
    )
  }

  if (profileImage?.type === 'svgXml') {
    return (
      <Avatar size="medium">
        <SvgXml height={48} width={48} xml={profileImage.svgXml.xml} />
      </Avatar>
    )
  }

  return (
    <ContactPictureImage
      contactId={phoneContactId ?? Option.none()}
      width={48}
      height={48}
      br="$5"
      objectFit="cover"
      fallback={<UserImagePlaceholder size={48} />}
    />
  )
}

export interface UpsertContactDialogResult {
  contactName: string
  saveToPhone: boolean
}

export const showUpsertContactDialogAtom = atom(
  null,
  (get, set, params: ShowUpsertContactDialogParams) => {
    const {t} = get(translationAtom)
    const formattedContactNumber = safeParsePhoneNumber(params.contactNumber)
    const isAlreadyInPhoneContacts = Option.isSome(
      params.phoneContactId ?? Option.none()
    )
    const contactNameAtom = atom(params.contactName ?? '')
    const saveToPhoneAtom = atom(params.type === 'create')
    const positiveButtonDisabledAtom = atom(
      (get) => get(contactNameAtom).trim().length === 0
    )

    return Effect.gen(function* (_) {
      const confirmed = yield* _(
        set(globalDialogAtom, {
          title:
            params.type === 'edit'
              ? t('addContactDialog.contactExistsTitle')
              : t('addContactDialog.addContact'),
          negativeButtonText:
            params.type === 'edit'
              ? t('addContactDialog.keepCurrent')
              : t('common.notNow'),
          positiveButtonText:
            params.type === 'edit'
              ? t('addContactDialog.update')
              : t('addContactDialog.addContact'),
          positiveButtonDisabledAtom,
          children:
            params.type === 'edit' ? (
              <ContactExistsFromLinkDialogBody
                contactNameAtom={contactNameAtom}
                contactNumber={formattedContactNumber}
                description={t('addContactDialog.contactExistsDescription', {
                  contactName: params.existingContactName,
                })}
                fallbackContactName={params.contactName}
                profileImage={params.profileImage}
                saveToPhoneAtom={saveToPhoneAtom}
                saveToPhoneLabel={
                  isAlreadyInPhoneContacts
                    ? t('addContactDialog.updateInYourPhoneContacts')
                    : t('addContactDialog.alsoSaveToYourPhone')
                }
                editLabel={t('common.edit')}
              />
            ) : (
              <UpsertContactDialogBody
                contactNameAtom={contactNameAtom}
                contactNumber={formattedContactNumber}
                fallbackContactName={params.contactName}
                placeholder={t('addContactDialog.addContactName')}
                phoneContactId={params.phoneContactId}
                profileImage={params.profileImage}
                saveToPhoneAtom={saveToPhoneAtom}
                saveToPhoneLabel={
                  isAlreadyInPhoneContacts
                    ? t('addContactDialog.updateInYourPhoneContacts')
                    : t('addContactDialog.alsoSaveToYourPhone')
                }
              />
            ),
        })
      )

      if (!confirmed) {
        return yield* _(
          Effect.fail(toBasicError('UserDeclinedError')(new Error('Declined')))
        )
      }

      return {
        contactName:
          get(contactNameAtom).trim() ||
          params.contactName ||
          params.contactNumber,
        saveToPhone: get(saveToPhoneAtom),
      } satisfies UpsertContactDialogResult
    })
  }
)
