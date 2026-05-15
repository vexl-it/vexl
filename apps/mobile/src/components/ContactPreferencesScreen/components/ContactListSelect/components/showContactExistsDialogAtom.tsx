import {
  CellPhoneMobileDevice,
  Selector,
  Typography,
  YStack,
} from '@vexl-next/ui'
import {Effect, Option} from 'effect'
import {atom} from 'jotai'
import React from 'react'
import {UpsertContactDialogContactRow} from '../../../../../state/contacts/atom/showUpsertContactDialogAtom'
import {type StoredContactWithComputedValues} from '../../../../../state/contacts/domain'
import {getInternationalPhoneNumber} from '../../../../../utils/getInternationalPhoneNumber'
import {translationAtom} from '../../../../../utils/localization/I18nProvider'
import {globalDialogAtom} from '../../../../GlobalDialog'

function ContactExistsDialogBody({
  contact,
  description,
  saveToPhoneAtom,
  saveToPhoneLabel,
}: {
  readonly contact: StoredContactWithComputedValues
  readonly description: string
  readonly saveToPhoneAtom: ReturnType<typeof atom<boolean>>
  readonly saveToPhoneLabel: string
}): React.JSX.Element {
  return (
    <YStack gap="$5">
      <Typography color="$foregroundSecondary" variant="paragraphSmall">
        {description}
      </Typography>
      <UpsertContactDialogContactRow
        contactName={contact.info.name}
        contactNumber={getInternationalPhoneNumber(
          contact.computedValues.normalizedNumber
        )}
        phoneContactId={contact.info.nonUniqueContactId}
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

export interface ContactExistsDialogResult {
  readonly saveToPhone: boolean
}

export const showContactExistsDialogAtom = atom(
  null,
  (
    get,
    set,
    params: {
      readonly existingContact: StoredContactWithComputedValues
      readonly saveToPhone: boolean
    }
  ): Effect.Effect<Option.Option<ContactExistsDialogResult>> => {
    const {t} = get(translationAtom)
    const saveToPhoneAtom = atom(params.saveToPhone)
    const isAlreadyInPhoneContacts = Option.isSome(
      params.existingContact.info.nonUniqueContactId
    )

    return Effect.gen(function* (_) {
      const confirmed = yield* _(
        set(globalDialogAtom, {
          title: t('addContactDialog.contactExistsTitle'),
          negativeButtonText: t('addContactDialog.keepCurrent'),
          positiveButtonText: t('addContactDialog.update'),
          children: (
            <ContactExistsDialogBody
              contact={params.existingContact}
              description={t('addContactDialog.contactExistsDescription', {
                contactName: params.existingContact.info.name,
              })}
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

      if (!confirmed) return Option.none()

      return Option.some({
        saveToPhone: get(saveToPhoneAtom),
      })
    })
  }
)
