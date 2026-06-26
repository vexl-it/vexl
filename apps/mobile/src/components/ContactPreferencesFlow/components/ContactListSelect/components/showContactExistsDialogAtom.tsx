import {Typography, YStack} from '@vexl-next/ui'
import {Effect} from 'effect'
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
}: {
  readonly contact: StoredContactWithComputedValues
  readonly description: string
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
    </YStack>
  )
}

export const showContactExistsDialogAtom = atom(
  null,
  (
    get,
    set,
    params: {
      readonly existingContact: StoredContactWithComputedValues
    }
  ): Effect.Effect<boolean> => {
    const {t} = get(translationAtom)

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
            />
          ),
        })
      )

      return confirmed
    })
  }
)
